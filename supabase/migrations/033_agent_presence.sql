CREATE TABLE agent_presence (
  agent_id UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'idle' CHECK (status IN (
    'idle', 'running', 'thinking', 'writing', 'testing', 'blocked', 'error', 'dead'
  )),
  current_task TEXT,
  current_file TEXT,                         -- Lock ownership for conflict warnings (File Ownership)
  progress_pct INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  ping_interval_ms INT DEFAULT 5000,
  session_model TEXT,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_presence" ON agent_presence FOR ALL USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE agent_presence;
