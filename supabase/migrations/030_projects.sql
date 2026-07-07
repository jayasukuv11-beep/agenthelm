CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,                             -- Repository URL (Git Integration)
  brain_version INT DEFAULT 0,               -- Current version counter
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user ON projects(user_id);

-- Link agents to projects
ALTER TABLE agents ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX idx_agents_project ON agents(project_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_projects" ON projects FOR ALL USING (user_id = auth.uid());
