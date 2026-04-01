-- Migration: 017_agent_memory.sql
-- Description: Store the Tier 2 Hierarchical memory index synced from local agents

CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  index_content TEXT NOT NULL, 
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure 1 memory record per agent
CREATE UNIQUE INDEX idx_agent_memory_unique ON agent_memory(agent_id);

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_agent_memory" ON agent_memory
  FOR ALL USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE agent_memory;
