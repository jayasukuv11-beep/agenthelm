-- Migration 037: Persist Brain Compiler merge plans and evidence details.
-- Sprint 1 makes compilation auditable before Brain mutation.

ALTER TABLE knowledge_proposals
  ADD COLUMN IF NOT EXISTS evidence_details JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS merge_plan JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS validation_errors TEXT[] DEFAULT '{}';

ALTER TABLE brain_versions
  ADD COLUMN IF NOT EXISTS entries_added_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entries_deprecated_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evidence_summary JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS merge_plan JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_proposals_conflicts
  ON knowledge_proposals (project_id, conflict_detected, build_status);
