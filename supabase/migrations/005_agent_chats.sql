CREATE TABLE agent_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','agent')),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'dashboard'
    CHECK (source IN ('dashboard','telegram')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chats_agent_id ON agent_chats(agent_id);
CREATE INDEX idx_chats_created ON agent_chats(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE agent_chats;
