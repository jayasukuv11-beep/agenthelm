-- Migration: 027_idempotency_unique.sql
-- Description: Enforce uniqueness of idempotency_key per agent to prevent
-- duplicate tool executions at the database level (not just application level).

CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_exec_idemp_unique
  ON tool_executions(agent_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
