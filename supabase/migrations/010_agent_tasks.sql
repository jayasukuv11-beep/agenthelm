CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  task_description TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  result JSONB,
  source TEXT DEFAULT 'dashboard'
    CHECK (source IN ('telegram','dashboard')),
  progress_messages TEXT[],
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX idx_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX idx_tasks_status ON agent_tasks(status);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_tasks" ON agent_tasks
  FOR ALL USING (user_id = auth.uid());
