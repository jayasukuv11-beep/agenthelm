-- Add 'progress' to agent_logs type
ALTER TABLE agent_logs
  DROP CONSTRAINT IF EXISTS agent_logs_type_check;

ALTER TABLE agent_logs
  ADD CONSTRAINT agent_logs_type_check
  CHECK (type IN ('log','error','output','tokens','chat_reply','progress'));
