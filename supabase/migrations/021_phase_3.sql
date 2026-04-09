-- Migration: 021_phase_3.sql
-- Description: Phase 3 — Debugging Suite (Reasoning Chains, Handoffs, Health Score)

-- ═══════════════════════════════════════════════════════════════
-- 1. Reasoning Chain Capture (Studio only)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE agent_reasoning_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  step_index INT NOT NULL,
  prompt_hash TEXT,
  prompt_summary TEXT,
  model_response_summary TEXT,
  decision TEXT,
  confidence DECIMAL(3,2),
  model TEXT,
  tokens_used INT DEFAULT 0,
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reasoning_agent ON agent_reasoning_steps(agent_id);
CREATE INDEX idx_reasoning_task ON agent_reasoning_steps(task_id);
CREATE INDEX idx_reasoning_created ON agent_reasoning_steps(created_at);

ALTER TABLE agent_reasoning_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages reasoning steps"
  ON agent_reasoning_steps FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Users view own reasoning steps"
  ON agent_reasoning_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_reasoning_steps.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 2. Multi-Agent Handoffs (Studio only)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE agent_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  payload JSONB,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','completed','failed')),
  latency_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_handoffs_from ON agent_handoffs(from_agent_id);
CREATE INDEX idx_handoffs_to ON agent_handoffs(to_agent_id);
CREATE INDEX idx_handoffs_task ON agent_handoffs(task_id);
CREATE INDEX idx_handoffs_status ON agent_handoffs(status);

ALTER TABLE agent_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages handoffs"
  ON agent_handoffs FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Users view own handoffs"
  ON agent_handoffs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE (agents.id = agent_handoffs.from_agent_id OR agents.id = agent_handoffs.to_agent_id)
      AND agents.user_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE agent_handoffs;
