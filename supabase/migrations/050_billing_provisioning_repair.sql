-- Migration 050: billing provisioning repair
-- Canonical plan ids are free | pro | team (matches subscription_plans seed,
-- DEFAULT_PLANS and the public pricing page). Legacy ids indie/studio map:
--   indie -> pro, studio -> team.
--
-- This migration:
--   1. Relaxes profiles.plan CHECK to accept both id families.
--   2. Backfills user_subscriptions from legacy `subscriptions` rows so users
--      who already paid keep their access (idempotent).
--   3. Syncs profiles.plan to canonical ids.
--   4. Adds a trigger that opens a fresh 30-day credit period on upgrade.

-- 1. profiles.plan: accept canonical + legacy ids
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free','pro','team','indie','studio'));

-- 1b. One active subscription row per user (required by webhook upsert +
--     increment_credits_used). Dedupe first, then constrain.
DELETE FROM user_subscriptions a
USING user_subscriptions b
WHERE a.user_id = b.user_id
  AND a.created_at > b.created_at;

ALTER TABLE user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;
ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

-- 2. Backfill: promote paid users from legacy table into user_subscriptions
INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
SELECT s.user_id,
       CASE s.plan WHEN 'indie' THEN 'pro' WHEN 'studio' THEN 'team' ELSE s.plan END,
       'active',
       COALESCE(s.activated_at, now()),
       COALESCE(s.expires_at, now() + INTERVAL '30 days')
FROM subscriptions s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.user_id = s.user_id AND us.status = 'active'
  );

-- 3. Sync profiles.plan to the canonical id for anyone with an active sub
UPDATE profiles p
SET plan = CASE s.plan WHEN 'indie' THEN 'pro'
                       WHEN 'studio' THEN 'team'
                       ELSE s.plan END,
    updated_at = now()
FROM subscriptions s
WHERE p.id = s.user_id AND s.status = 'active';

-- 4. Fresh credit period whenever a subscription becomes active
CREATE OR REPLACE FUNCTION bump_period_on_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    NEW.current_period_start = now();
    NEW.current_period_end = now() + INTERVAL '30 days';
    NEW.credits_used_this_period = 0;
    NEW.credits_reset_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_period_on_upgrade ON user_subscriptions;
CREATE TRIGGER trg_bump_period_on_upgrade
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION bump_period_on_upgrade();

-- 5. profiles.credits: balance consumed by deduct_credit()/refund_credit()
--    (045_credit_ledger.sql) but never declared in any earlier migration.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits BIGINT NOT NULL DEFAULT 100;

-- 6. Monthly period rollover: resets the counter and re-grants the plan's
--    monthly credits. Called lazily from getPlanForUser().
CREATE OR REPLACE FUNCTION reset_expired_periods(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
BEGIN
  UPDATE user_subscriptions
  SET current_period_start = now(),
      current_period_end   = now() + INTERVAL '30 days',
      credits_used_this_period = 0,
      credits_reset_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end < now();

  IF FOUND THEN
    SELECT plan_id INTO v_plan FROM user_subscriptions
    WHERE user_id = p_user_id AND status = 'active' LIMIT 1;

    UPDATE profiles
    SET credits = CASE v_plan
                     WHEN 'pro' THEN 2000
                     WHEN 'team' THEN 10000
                     ELSE 100
                   END,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION reset_expired_periods(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION reset_expired_periods(UUID) TO authenticated, service_role;
