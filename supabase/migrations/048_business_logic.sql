-- Migration 048: Business Logic & Subscription Plans
-- 3 Pricing Tiers (Free, Pro, Team), User Subscriptions, and Usage Tracking

CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  credits_monthly INTEGER NOT NULL,
  max_agents INTEGER NOT NULL,
  max_projects INTEGER NOT NULL,
  max_brain_entries INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_equivalent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Plans
INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, credits_monthly, max_agents, max_projects, max_brain_entries, features)
VALUES
  ('free', 'Free', 0, 0, 100, 1, 1, 50,
   '{"brain_seeding": true, "export": true, "telegram_notifications": false, "cross_agent": false, "policy_engine": "gated_only", "sarvam_calls_per_day": 100}'::jsonb),
  ('pro', 'Pro', 49900, 499900, 2000, 3, 3, 500,
   '{"brain_seeding": true, "export": true, "telegram_notifications": true, "cross_agent": true, "policy_engine": "all_modes", "sarvam_calls_per_day": 1000, "document_intelligence": true, "translation": true}'::jsonb),
  ('team', 'Team', 199900, 1999900, 10000, 10, 10, -1,
   '{"brain_seeding": true, "export": true, "telegram_notifications": true, "cross_agent": true, "policy_engine": "all_modes", "sarvam_calls_per_day": 5000, "document_intelligence": true, "translation": true, "sso": false, "audit_log_export": true}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  credits_monthly = EXCLUDED.credits_monthly,
  max_agents = EXCLUDED.max_agents,
  max_projects = EXCLUDED.max_projects,
  max_brain_entries = EXCLUDED.max_brain_entries,
  features = EXCLUDED.features;

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  cashfree_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  credits_used_this_period INTEGER NOT NULL DEFAULT 0,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usage events
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_subscriptions" ON user_subscriptions;
CREATE POLICY "users_own_subscriptions" ON user_subscriptions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_usage" ON usage_events;
CREATE POLICY "users_own_usage" ON usage_events
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_usage_events_user_date ON usage_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events (event_type, created_at DESC);
