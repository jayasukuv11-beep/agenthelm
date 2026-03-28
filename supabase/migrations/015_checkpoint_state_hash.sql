-- Migration: 015_checkpoint_state_hash.sql
-- Description: Add SHA256 integrity hash to checkpoints for corruption detection

ALTER TABLE agent_checkpoints ADD COLUMN IF NOT EXISTS state_hash TEXT;

-- Index for fast hash lookups during verification
CREATE INDEX IF NOT EXISTS idx_checkpoints_hash ON agent_checkpoints(state_hash);
