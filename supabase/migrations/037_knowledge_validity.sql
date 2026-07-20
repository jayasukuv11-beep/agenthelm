-- Migration 037: Knowledge Validity & Staleness Tracking

ALTER TABLE brain_entries
  ADD COLUMN IF NOT EXISTS validity_status TEXT DEFAULT 'CURRENT' CHECK (validity_status IN ('CURRENT', 'NEEDS_REVIEW', 'STALE', 'SUPERSEDED')),
  ADD COLUMN IF NOT EXISTS stale_reason TEXT,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS validated_against_version INT;

-- superseded_by already exists in brain_entries from Migration 035

-- Create an index to quickly filter out STALE/SUPERSEDED items during normal retrieval
CREATE INDEX IF NOT EXISTS idx_brain_entries_validity
  ON brain_entries (project_id, validity_status)
  WHERE status = 'active';
