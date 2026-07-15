-- Migration: 039_cascade_project_deletion.sql
-- Description: Alter foreign keys to enable full ON DELETE CASCADE for project deletion.

-- 1. agents.project_id -> ON DELETE CASCADE (was SET NULL)
ALTER TABLE public.agents
  DROP CONSTRAINT IF EXISTS agents_project_id_fkey,
  ADD CONSTRAINT agents_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 2. credit_usage.agent_id -> ON DELETE CASCADE (was SET NULL)
ALTER TABLE public.credit_usage
  DROP CONSTRAINT IF EXISTS credit_usage_agent_id_fkey,
  ADD CONSTRAINT credit_usage_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

-- 3. Check and handle agent_handoffs table (create if missing on production)
CREATE TABLE IF NOT EXISTS public.agent_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID,
  to_agent_id UUID,
  task_id UUID,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','failed')),
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure correct constraints on agent_handoffs
ALTER TABLE public.agent_handoffs
  DROP CONSTRAINT IF EXISTS agent_handoffs_from_agent_id_fkey,
  DROP CONSTRAINT IF EXISTS agent_handoffs_to_agent_id_fkey,
  DROP CONSTRAINT IF EXISTS agent_handoffs_task_id_fkey,
  ADD CONSTRAINT agent_handoffs_from_agent_id_fkey
    FOREIGN KEY (from_agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  ADD CONSTRAINT agent_handoffs_to_agent_id_fkey
    FOREIGN KEY (to_agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  ADD CONSTRAINT agent_handoffs_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES public.agent_tasks(id) ON DELETE CASCADE;

-- Re-create indexes and RLS if they don't exist
CREATE INDEX IF NOT EXISTS idx_handoffs_from ON public.agent_handoffs(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_to ON public.agent_handoffs(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_task ON public.agent_handoffs(task_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_status ON public.agent_handoffs(status);

ALTER TABLE public.agent_handoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages handoffs" ON public.agent_handoffs;
CREATE POLICY "Service role manages handoffs"
  ON public.agent_handoffs FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own handoffs" ON public.agent_handoffs;
CREATE POLICY "Users view own handoffs"
  ON public.agent_handoffs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE (agents.id = agent_handoffs.from_agent_id OR agents.id = agent_handoffs.to_agent_id)
      AND agents.user_id = auth.uid()
    )
  );

-- Safely add to publication (ignore error if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_handoffs;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
