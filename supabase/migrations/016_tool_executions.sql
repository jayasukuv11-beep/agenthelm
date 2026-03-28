-- Migration: 016_tool_executions.sql
-- Description: Classification-First execution tracking for the Pre-Action Gate
-- Supports: @dock.read, @dock.side_effect, @dock.irreversible

CREATE TABLE tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  classification TEXT NOT NULL
    CHECK (classification IN ('read', 'side_effect', 'irreversible')),
  idempotency_key TEXT,               -- SHA256 hash for dedup (side_effect)
  input_hash TEXT,                    -- SHA256 of input for irreversible approval
  input_preview TEXT,                 -- first 200 chars of args for human review
  confirm_channel TEXT DEFAULT 'telegram'
    CHECK (confirm_channel IN ('telegram', 'dashboard')),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  status TEXT DEFAULT 'executed'
    CHECK (status IN (
      'pending_approval', 'approved', 'executed',
      'failed', 'rejected', 'timeout_rejected'
    )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups
CREATE INDEX idx_tool_exec_agent ON tool_executions(agent_id);
CREATE INDEX idx_tool_exec_task ON tool_executions(task_id);
CREATE INDEX idx_tool_exec_status ON tool_executions(status);
CREATE INDEX idx_tool_exec_input_hash ON tool_executions(input_hash);
CREATE INDEX idx_tool_exec_idemp ON tool_executions(idempotency_key);

-- RLS
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_tool_executions" ON tool_executions
  FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Realtime (so dashboard/Telegram can see pending approvals live)
ALTER PUBLICATION supabase_realtime ADD TABLE tool_executions;

-- Auto-update updated_at
CREATE TRIGGER update_tool_executions_updated_at
  BEFORE UPDATE ON tool_executions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
