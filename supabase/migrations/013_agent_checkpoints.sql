-- Step-level checkpoints for resumable agent runs
CREATE TABLE agent_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  step_name TEXT,
  status TEXT DEFAULT 'completed'
    CHECK (status IN ('running','completed','failed','skipped')),
  state_snapshot JSONB,
  state_delta JSONB,
  input_data JSONB,
  output_data JSONB,
  tokens_used INT DEFAULT 0,
  latency_ms INT,
  error_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_task ON agent_checkpoints(task_id, step_index);
CREATE INDEX idx_checkpoints_agent ON agent_checkpoints(agent_id);

-- RLS
ALTER TABLE agent_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_checkpoints" ON agent_checkpoints
  FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_checkpoints;
