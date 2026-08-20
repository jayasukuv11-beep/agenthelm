-- Migration 046: Project Policy Engine & Audit Logging
-- Supports 4 modes (gated, auto, shadow, disabled) and configurable auto-apply / gate / reject rules

CREATE TABLE IF NOT EXISTS project_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  mode VARCHAR(20) NOT NULL DEFAULT 'gated' CHECK (mode IN ('gated', 'auto', 'shadow', 'disabled')),
  auto_apply_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  gate_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  reject_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  thresholds JSONB NOT NULL DEFAULT '{"min_evidence_score": 60, "max_risk_level": "medium"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES knowledge_proposals(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('allow', 'review', 'reject', 'shadow')),
  rules_matched JSONB NOT NULL DEFAULT '[]'::jsonb,
  mode VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  evidence_score REAL,
  elapsed_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE project_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_project_policies" ON project_policies;
CREATE POLICY "users_own_project_policies" ON project_policies
  FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_policies.project_id AND projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_policies.project_id AND projects.user_id = auth.uid()));

DROP POLICY IF EXISTS "users_own_policy_audit_log" ON policy_audit_log;
CREATE POLICY "users_own_policy_audit_log" ON policy_audit_log
  FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = policy_audit_log.project_id AND projects.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = policy_audit_log.project_id AND projects.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_policy_audit_project ON policy_audit_log (project_id, created_at DESC);
