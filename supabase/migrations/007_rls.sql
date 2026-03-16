-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commands ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Agents
CREATE POLICY "users_own_agents" ON agents
  FOR ALL USING (user_id = auth.uid());

-- Logs (through agent ownership)
CREATE POLICY "users_own_logs" ON agent_logs
  FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Credits
CREATE POLICY "users_own_credits" ON credit_usage
  FOR ALL USING (user_id = auth.uid());

-- Chats
CREATE POLICY "users_own_chats" ON agent_chats
  FOR ALL USING (user_id = auth.uid());

-- Commands
CREATE POLICY "users_own_commands" ON agent_commands
  FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );
