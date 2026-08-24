-- Migration 044: RLS Hardening & Privilege Isolation
-- Closes permissive policies and locks down SECURITY DEFINER execution permissions

-- 1. Fix agent_handoffs permissive policy
-- NOTE: agent_handoffs has no user_id column in this deployment; ownership is
-- enforced at the API layer (authorizeSdkAgent). We enable RLS to close the
-- permissive USING(true) policy and only create a user-scoped policy if the
-- column exists (fresh installs get it via later migrations).
DROP POLICY IF EXISTS "Allow all on agent_handoffs" ON agent_handoffs;
DROP POLICY IF EXISTS "Public handoffs" ON agent_handoffs;
DROP POLICY IF EXISTS "agent_handoffs_policy" ON agent_handoffs;
DROP POLICY IF EXISTS "users_own_agent_handoffs" ON agent_handoffs;
ALTER TABLE agent_handoffs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_handoffs' AND column_name = 'user_id'
  ) THEN
    CREATE POLICY "users_own_agent_handoffs" ON agent_handoffs
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 2. Fix subscriptions permissive policy
DROP POLICY IF EXISTS "Allow all on subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Public subscriptions" ON subscriptions;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_subscriptions_legacy" ON subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Revoke dangerous function executions from public / anon / authenticated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- 4. Set safe search_path on sensitive functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'bump_brain_version') THEN
    ALTER FUNCTION bump_brain_version() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_connect_key') THEN
    ALTER FUNCTION generate_connect_key() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION handle_new_user() SET search_path = public, pg_temp;
  END IF;
END $$;
