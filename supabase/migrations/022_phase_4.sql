-- Phase 4: Enterprise Hardening

-- Add latency_ms to agent_tasks for SLA tracking
ALTER TABLE agent_tasks 
ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

-- Ensure an index on latency_ms for faster SLA analytics
CREATE INDEX IF NOT EXISTS idx_agent_tasks_latency ON agent_tasks(latency_ms);
