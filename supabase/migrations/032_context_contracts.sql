CREATE TABLE context_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  content_hash TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  decisions JSONB DEFAULT '[]',
  files_modified TEXT[],                     -- Changed files (Git Integration)
  apis_affected JSONB DEFAULT '[]',
  db_changes JSONB DEFAULT '[]',
  known_limitations TEXT[],
  next_steps TEXT[],
  
  -- Validation inputs for evidence-based confidence
  tests_passed BOOLEAN DEFAULT FALSE,
  human_reviewed BOOLEAN DEFAULT FALSE,

  -- Git integration
  commit_sha TEXT,                           -- Commit SHA (Git Integration)
  branch TEXT,                               -- Branch (Git Integration)
  author TEXT,                               -- Author (Git Integration)

  -- Builder state
  build_status TEXT DEFAULT 'pending' CHECK (build_status IN (
    'pending', 'processing', 'merged', 'rejected'
  )),
  merged_into_version INT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_project_time ON context_contracts(project_id, created_at DESC);
CREATE INDEX idx_contracts_pending ON context_contracts(build_status) WHERE build_status = 'pending';
CREATE INDEX idx_contracts_files ON context_contracts USING GIN(files_modified);

ALTER TABLE context_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_contracts" ON context_contracts FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE context_contracts;
