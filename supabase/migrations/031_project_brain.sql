-- Brain Evolution Versioning (Git-like snapshots + Change Rationale)
CREATE TABLE brain_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version INT NOT NULL,
  parent_version INT,
  
  -- Brain Evolution Metadata
  evolution_reason TEXT NOT NULL,            -- Reason for change/evolution
  built_from_contracts UUID[],               -- Associated contracts
  files_changed_count INT DEFAULT 0,
  apis_changed_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_brain_ver_unique ON brain_versions(project_id, version);
CREATE INDEX idx_brain_ver_latest ON brain_versions(project_id, version DESC);

-- Brain entries (Knowledge items)
CREATE TABLE brain_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  brain_version_id UUID NOT NULL REFERENCES brain_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'architecture', 'decisions', 'goals', 'standards',
    'progress', 'changes', 'apis', 'database', 'testing', 'custom'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  content_hash TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'deprecated')),
  tags TEXT[],
  depends_on UUID[],
  
  -- Knowledge Source & Trust Tracking
  source_type TEXT NOT NULL CHECK (source_type IN (
    'ai_contract', 'git_commit', 'documentation', 'openapi', 'schema', 'human'
  )),
  source_path TEXT,                          -- Path to file, commit ID, or contract ID
  confidence INT DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entries_version ON brain_entries(brain_version_id, category);
CREATE INDEX idx_entries_project ON brain_entries(project_id);

-- Full-text search
ALTER TABLE brain_entries ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content::text)) STORED;
CREATE INDEX idx_entries_search ON brain_entries USING GIN(search_vector);

-- Bump project brain_version
CREATE OR REPLACE FUNCTION bump_brain_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET brain_version = NEW.version, updated_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brain_version_bump
  AFTER INSERT ON brain_versions
  FOR EACH ROW EXECUTE FUNCTION bump_brain_version();

ALTER TABLE brain_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_brain_versions" ON brain_versions FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
CREATE POLICY "users_own_brain_entries" ON brain_entries FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE brain_versions;
