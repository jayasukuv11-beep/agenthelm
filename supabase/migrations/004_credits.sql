CREATE TABLE credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  tokens_used INT NOT NULL DEFAULT 0,
  model TEXT,
  cost_usd DECIMAL(10,8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credits_user_id ON credit_usage(user_id);
CREATE INDEX idx_credits_agent_id ON credit_usage(agent_id);
CREATE INDEX idx_credits_created ON credit_usage(created_at DESC);
