-- Migration 047: Retention Features & Brain Extensions
-- Adds context_injections for time-saved analytics and multilingual fields to brain entries

CREATE TABLE IF NOT EXISTS context_injections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_hint TEXT,
  entries_returned INTEGER NOT NULL DEFAULT 0,
  tokens_returned INTEGER NOT NULL DEFAULT 0,
  estimated_seconds_saved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE context_injections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_context_injections" ON context_injections;
CREATE POLICY "users_own_context_injections" ON context_injections
  FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = context_injections.project_id AND projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = context_injections.project_id AND projects.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_context_injections_project ON context_injections (project_id, created_at DESC);

-- Extend brain_entries with multilingual and audit columns if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brain_entries' AND column_name = 'original_text') THEN
    ALTER TABLE brain_entries ADD COLUMN original_text TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brain_entries' AND column_name = 'translated_text') THEN
    ALTER TABLE brain_entries ADD COLUMN translated_text TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brain_entries' AND column_name = 'source_language') THEN
    ALTER TABLE brain_entries ADD COLUMN source_language TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brain_entries' AND column_name = 'is_translated') THEN
    ALTER TABLE brain_entries ADD COLUMN is_translated BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Extend knowledge_proposals with Sarvam intelligence columns if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_proposals' AND column_name = 'sarvam_category') THEN
    ALTER TABLE knowledge_proposals ADD COLUMN sarvam_category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_proposals' AND column_name = 'sarvam_risk_level') THEN
    ALTER TABLE knowledge_proposals ADD COLUMN sarvam_risk_level TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_proposals' AND column_name = 'sarvam_confidence') THEN
    ALTER TABLE knowledge_proposals ADD COLUMN sarvam_confidence REAL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_proposals' AND column_name = 'sarvam_summary') THEN
    ALTER TABLE knowledge_proposals ADD COLUMN sarvam_summary TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_proposals' AND column_name = 'semantic_tags') THEN
    ALTER TABLE knowledge_proposals ADD COLUMN semantic_tags TEXT[];
  END IF;
END $$;
