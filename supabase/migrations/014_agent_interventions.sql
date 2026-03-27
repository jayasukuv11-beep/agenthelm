-- Migration: 014_agent_interventions.sql
-- Description: Create agent_interventions table for Phase 4 State Divergence Handling

CREATE TYPE intervention_type AS ENUM ('stop', 'pause', 'resume', 'rollback', 'state_override');
CREATE TYPE intervention_status AS ENUM ('pending', 'applied', 'dismissed');

CREATE TABLE IF NOT EXISTS public.agent_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,
    type intervention_type NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status intervention_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX idx_interventions_agent_task ON public.agent_interventions(agent_id, task_id);
CREATE INDEX idx_interventions_status ON public.agent_interventions(status);

-- RLS
ALTER TABLE public.agent_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access interventions for their own agents"
    ON public.agent_interventions
    FOR ALL
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_interventions;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agent_interventions_updated_at
    BEFORE UPDATE ON public.agent_interventions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
