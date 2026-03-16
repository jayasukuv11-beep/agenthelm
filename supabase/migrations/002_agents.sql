CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'idle' 
    CHECK (status IN ('running','idle','stopped','error')),
  agent_type TEXT DEFAULT 'python'
    CHECK (agent_type IN ('python','node','other')),
  version TEXT,
  last_ping TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_ping ON agents(last_ping);
