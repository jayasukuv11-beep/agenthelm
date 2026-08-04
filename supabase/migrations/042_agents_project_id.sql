-- Migration: Add project_id to agents table for MCP agent project association
-- This allows tracking which project an agent is connected to

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_project_id ON agents(project_id);

-- Add unique constraint to prevent duplicate agent names per project per agent_type
-- This allows "Claude" (node) and "Codex" (node) to coexist in different projects
-- but prevents duplicate names of same type in same project
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_unique_per_project_type
ON agents (user_id, project_id, name, agent_type)
WHERE project_id IS NOT NULL;