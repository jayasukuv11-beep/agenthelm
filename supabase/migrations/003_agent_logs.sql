CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'log' 
    CHECK (type IN ('log','error','output','tokens','chat_reply')),
  level TEXT DEFAULT 'info'
    CHECK (level IN ('info','warning','error','success')),
  message TEXT NOT NULL,
  data JSONB,
  tokens_used INT DEFAULT 0,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_agent_id ON agent_logs(agent_id);
CREATE INDEX idx_logs_created ON agent_logs(created_at DESC);
CREATE INDEX idx_logs_type ON agent_logs(type);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
