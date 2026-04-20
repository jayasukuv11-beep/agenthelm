-- Migration: 025_fix_rls_policies.sql
-- Description: SECURITY FIX — Remove overly permissive USING(true) RLS policies
-- that effectively disable row-level security for authenticated users.
-- Service role already bypasses RLS by default in Supabase — these policies are
-- redundant AND dangerous because they make ALL rows visible to ALL users.

-- Fix injection_events: remove permissive service role policy
DROP POLICY IF EXISTS "Service role can manage injection events" ON injection_events;
DROP POLICY IF EXISTS "service_role_injection" ON injection_events;

-- Fix agent_reasoning_steps: remove permissive policy
DROP POLICY IF EXISTS "Service role manages reasoning steps" ON agent_reasoning_steps;
DROP POLICY IF EXISTS "service_role_reasoning" ON agent_reasoning_steps;


-- Verify remaining policies are user-scoped only
-- (The SELECT policies joining through agents.user_id are correct — keep those)
