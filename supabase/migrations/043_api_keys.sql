-- Migration 043: Hashed API Keys
-- Replaces plaintext connect keys with SHA-256 hashed API keys with scoping and lifecycle management

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL DEFAULT 'Default API Key',
  scope VARCHAR(30) NOT NULL DEFAULT 'agent' CHECK (scope IN ('agent', 'admin', 'readonly')),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_api_keys" ON api_keys;
CREATE POLICY "users_own_api_keys" ON api_keys
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index on key_hash for fast lookups on active keys
CREATE INDEX IF NOT EXISTS idx_api_keys_lookup ON api_keys (key_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
