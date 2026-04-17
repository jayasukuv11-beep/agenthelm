-- Add to agent_eval_sets
ALTER TABLE agent_eval_sets ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE agent_eval_sets ADD COLUMN source_task_id UUID REFERENCES agent_tasks(id);

-- Add to agent_eval_results
ALTER TABLE agent_eval_results ADD COLUMN agent_version TEXT;

-- New table
CREATE TABLE eval_regressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  eval_set_id UUID REFERENCES agent_eval_sets(id),
  baseline_version TEXT NOT NULL,
  current_version TEXT NOT NULL,
  metric TEXT NOT NULL, -- 'pass_rate' or 'semantic_score'
  baseline_value FLOAT NOT NULL,
  current_value FLOAT NOT NULL,
  delta FLOAT NOT NULL, -- negative = regression
  threshold_used FLOAT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE eval_regressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own regressions" ON eval_regressions
  FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );
