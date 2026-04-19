-- Migration: 026_fix_constraints.sql
-- Description: Fix CHECK constraint violations that cause silent INSERT failures
-- for Telegram dispatch ('dispatch' command_type) and draft tasks ('draft' status).

-- Fix agent_commands: add 'dispatch' to allowed command types
ALTER TABLE agent_commands
  DROP CONSTRAINT IF EXISTS agent_commands_command_type_check;
ALTER TABLE agent_commands
  ADD CONSTRAINT agent_commands_command_type_check
  CHECK (command_type IN ('stop','start','restart','chat','custom','dispatch'));

-- Fix agent_tasks: add 'draft' and 'cancelled' to allowed statuses
ALTER TABLE agent_tasks
  DROP CONSTRAINT IF EXISTS agent_tasks_status_check;
ALTER TABLE agent_tasks
  ADD CONSTRAINT agent_tasks_status_check
  CHECK (status IN ('pending','running','completed','failed','draft','cancelled'));

-- Add delivery tracking for commands (fix for permanent command loss)
ALTER TABLE agent_commands 
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_attempts INT DEFAULT 0;

ALTER TABLE agent_commands
  DROP CONSTRAINT IF EXISTS agent_commands_status_check;
ALTER TABLE agent_commands
  ADD CONSTRAINT agent_commands_status_check
  CHECK (status IN ('pending','delivering','delivered','completed'));
