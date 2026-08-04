-- Release hardening: remove policies that bypass RLS.
-- The Supabase service role already bypasses RLS and therefore needs no policy.
DROP POLICY IF EXISTS "Service role manages handoffs" ON public.agent_handoffs;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Security-definer trigger/event-trigger functions are invoked internally.
-- They must not be callable through the public PostgREST RPC surface.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Pin function resolution so untrusted schemas cannot influence privileged code.
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.bump_brain_version() SET search_path = pg_catalog, public;
ALTER FUNCTION public.generate_connect_key() SET search_path = pg_catalog, public;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;

-- Cover foreign keys that production queries and cascading deletes traverse.
CREATE INDEX IF NOT EXISTS idx_agent_chats_user_id ON public.agent_chats (user_id);
CREATE INDEX IF NOT EXISTS idx_agent_eval_sets_source_task_id ON public.agent_eval_sets (source_task_id);
CREATE INDEX IF NOT EXISTS idx_agent_reasoning_steps_agent_id ON public.agent_reasoning_steps (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reasoning_steps_task_id ON public.agent_reasoning_steps (task_id);
CREATE INDEX IF NOT EXISTS idx_ai_timeline_events_agent_id ON public.ai_timeline_events (agent_id);
CREATE INDEX IF NOT EXISTS idx_brain_entries_superseded_by ON public.brain_entries (superseded_by);
CREATE INDEX IF NOT EXISTS idx_eval_regressions_agent_id ON public.eval_regressions (agent_id);
CREATE INDEX IF NOT EXISTS idx_eval_regressions_eval_set_id ON public.eval_regressions (eval_set_id);
CREATE INDEX IF NOT EXISTS idx_injection_events_agent_id ON public.injection_events (agent_id);
CREATE INDEX IF NOT EXISTS idx_injection_events_task_id ON public.injection_events (task_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_proposals_agent_id ON public.knowledge_proposals (agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_proposals_reviewer_id ON public.knowledge_proposals (reviewer_id);
