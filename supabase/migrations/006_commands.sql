CREATE TABLE agent_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL
    CHECK (command_type IN ('stop','start','restart','chat','custom')),
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','delivered','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commands_agent_pending 
  ON agent_commands(agent_id, status) 
  WHERE status = 'pending';
