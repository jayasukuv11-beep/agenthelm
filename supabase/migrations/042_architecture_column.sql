-- Migration 042: Add architecture column to knowledge_proposals
-- The MCP server sends architecture data in proposals, but the column doesn't exist.

ALTER TABLE knowledge_proposals
  ADD COLUMN IF NOT EXISTS architecture JSONB DEFAULT '[]';