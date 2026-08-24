-- Migration 049: increment_credits_used
-- Called by lib/billing/plans.ts recordUsage() to atomically bump the current
-- subscription period's credit counter. Creates the period row if absent so
-- free-tier users (who never subscribed) are still metered.

CREATE OR REPLACE FUNCTION increment_credits_used(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_id TEXT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  -- Resolve the user's active plan (default free).
  SELECT plan_id INTO v_plan_id
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_id, status)
    VALUES (p_user_id, 'free', 'active')
    ON CONFLICT DO NOTHING;
    v_plan_id := 'free';
  END IF;

  UPDATE user_subscriptions
  SET credits_used_this_period = credits_used_this_period + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id AND status = 'active';
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_credits_used(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
