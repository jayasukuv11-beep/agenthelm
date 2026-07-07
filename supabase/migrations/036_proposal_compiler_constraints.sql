-- Migration 036: Align Project Brain constraints with Knowledge Proposals.
-- Migration 035 renames context_contracts to knowledge_proposals and the
-- Brain Compiler writes source_type = 'ai_proposal'. The original CHECK
-- constraint only allowed ai_contract, so compiled proposals would fail.

ALTER TABLE brain_entries
  DROP CONSTRAINT IF EXISTS brain_entries_source_type_check;

ALTER TABLE brain_entries
  ADD CONSTRAINT brain_entries_source_type_check CHECK (source_type IN (
    'ai_proposal',
    'ai_contract',
    'git_commit',
    'documentation',
    'openapi',
    'schema',
    'human'
  ));

ALTER TABLE knowledge_proposals
  DROP CONSTRAINT IF EXISTS context_contracts_build_status_check;

ALTER TABLE knowledge_proposals
  ADD CONSTRAINT knowledge_proposals_build_status_check CHECK (build_status IN (
    'pending',
    'processing',
    'reviewing',
    'merged',
    'rejected'
  ));

ALTER TABLE brain_versions
  ADD COLUMN IF NOT EXISTS built_from_proposals UUID[];

UPDATE brain_versions
SET built_from_proposals = built_from_contracts
WHERE built_from_proposals IS NULL
  AND built_from_contracts IS NOT NULL;
