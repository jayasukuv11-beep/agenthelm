-- Add kill_reason to agent_tasks
ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS kill_reason TEXT;

-- Create injection_events table
CREATE TABLE IF NOT EXISTS injection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  input_text TEXT,
  trust_score DECIMAL(3,2),
  flags TEXT[],
  action_taken TEXT CHECK (action_taken IN ('allowed','warned','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on injection_events
ALTER TABLE injection_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage injection events"
  ON injection_events FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow users to view their own agents' injection events
CREATE POLICY "Users can view own agent injection events"
  ON injection_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = injection_events.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Update agent_logs type constraints to allow new telemetry
ALTER TABLE agent_logs
  DROP CONSTRAINT IF EXISTS agent_logs_type_check;

ALTER TABLE agent_logs
  ADD CONSTRAINT agent_logs_type_check
  CHECK (type IN ('log','error','output','tokens','chat_reply','progress','tool_execution','loop_detected','injection','hard_limit','burn_rate'));
