-- Migration: 020_phase_2.sql
-- Description: Phase 2 Retention Engine - Cost Attribution & Budgets

-- Add daily budget column to agents for budget tracking warnings
ALTER TABLE agents ADD COLUMN daily_budget_usd DECIMAL(10,2);

-- Add indexes for per-model cost queries (used by Cost Attribution Dashboard)
CREATE INDEX idx_credits_model ON credit_usage(model);
-- created_at index already exists from 004_credits.sql
