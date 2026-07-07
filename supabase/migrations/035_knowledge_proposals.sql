-- ============================================================
-- Migration 035: Knowledge Proposals & Brain Compiler
-- Renames context_contracts → knowledge_proposals
-- Adds conflict detection and knowledge evolution columns
-- ============================================================

-- Step 1: Rename the table
ALTER TABLE IF EXISTS context_contracts RENAME TO knowledge_proposals;

-- Step 2: Add proposal-specific columns
ALTER TABLE knowledge_proposals
  ADD COLUMN IF NOT EXISTS conflict_detected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS conflict_details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evidence_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Step 3: Update build_status enum to include 'reviewing'
-- (We stored as text, so we just need to document the valid values)
-- Valid statuses: pending, reviewing, merged, rejected

-- Step 4: Add supersession tracking to brain_entries
ALTER TABLE brain_entries
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES brain_entries(id),
  ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS evidence_score INTEGER DEFAULT 100;

-- Step 5: Create index for conflict detection lookups
-- Brain Compiler needs to quickly find active entries by category+title
CREATE INDEX IF NOT EXISTS idx_brain_entries_active_category
  ON brain_entries (project_id, category, title)
  WHERE status = 'active';

-- Step 6: Create index for proposal queue processing
CREATE INDEX IF NOT EXISTS idx_proposals_pending
  ON knowledge_proposals (project_id, build_status)
  WHERE build_status IN ('pending', 'reviewing');

-- Step 7: Composite index for inject route performance
CREATE INDEX IF NOT EXISTS idx_brain_entries_project_status
  ON brain_entries (project_id, status);
