-- Phase 5: Evaluation Runner, LLM-as-Judge, Tool Permissions

-- 1. Evaluator Definitions (Golden Datasets)
CREATE TABLE IF NOT EXISTS agent_eval_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    input_data JSONB NOT NULL,
    expected_tools TEXT[], -- array of tool names expected to be called
    expected_output TEXT,
    max_tool_calls INTEGER DEFAULT 10,
    max_tokens INTEGER DEFAULT 20000,
    judge_rubric JSONB, -- {"relevance": "Results must be hotels in Paris", ...}
    judge_model TEXT DEFAULT 'gpt-4o-mini',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_eval_sets_agent ON agent_eval_sets(agent_id);

-- 2. Eval Results
CREATE TABLE IF NOT EXISTS agent_eval_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eval_set_id UUID REFERENCES agent_eval_sets(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    tool_matches BOOLEAN NOT NULL,
    semantic_scores JSONB, -- {"relevance": 0.95, "price_accuracy": 0.88}
    tokens_used INTEGER,
    latency_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_eval_results_agent ON agent_eval_results(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_eval_results_set ON agent_eval_results(eval_set_id);

-- 3. Scoped Permissions
CREATE TABLE IF NOT EXISTS agent_tool_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
    allowed_tools TEXT[], -- if null/empty, assume ALL tools are allowed (backwards compat)
    block_mode BOOLEAN DEFAULT TRUE, -- TRUE = strictly block, FALSE = warn only
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_tool_permissions_agent ON agent_tool_permissions(agent_id);

-- Enable RLS for these new tables
ALTER TABLE agent_eval_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_eval_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for eval sets
CREATE POLICY "Users can view their own eval sets"
    ON agent_eval_sets FOR SELECT
    USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_eval_sets.agent_id AND agents.user_id = auth.uid()));

CREATE POLICY "Users can insert their own eval sets"
    ON agent_eval_sets FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_eval_sets.agent_id AND agents.user_id = auth.uid()));

CREATE POLICY "Users can delete their own eval sets"
    ON agent_eval_sets FOR DELETE
    USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_eval_sets.agent_id AND agents.user_id = auth.uid()));

-- Policies for eval results
CREATE POLICY "Users can view their own eval results"
    ON agent_eval_results FOR SELECT
    USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_eval_results.agent_id AND agents.user_id = auth.uid()));

CREATE POLICY "Users can insert their own eval results"
    ON agent_eval_results FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_eval_results.agent_id AND agents.user_id = auth.uid()));

-- Policies for permissions
CREATE POLICY "Users can view their own tool permissions"
    ON agent_tool_permissions FOR SELECT
    USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_tool_permissions.agent_id AND agents.user_id = auth.uid()));

CREATE POLICY "Users can update their own tool permissions"
    ON agent_tool_permissions FOR ALL
    USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_tool_permissions.agent_id AND agents.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_tool_permissions.agent_id AND agents.user_id = auth.uid()));
