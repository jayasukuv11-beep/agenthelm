-- Add 'dispatch' to agent_commands command_type
ALTER TABLE agent_commands
  DROP CONSTRAINT IF EXISTS agent_commands_command_type_check;

ALTER TABLE agent_commands
  ADD CONSTRAINT agent_commands_command_type_check
  CHECK (command_type IN ('stop','start','restart','chat','custom','dispatch'));
