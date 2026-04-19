-- Migration: 028_credit_constraints.sql
-- Description: Prevent negative tokens and costs to avoid billing manipulation

ALTER TABLE credit_usage 
  ADD CONSTRAINT credit_usage_tokens_positive 
  CHECK (tokens_used >= 0);

ALTER TABLE credit_usage
  ADD CONSTRAINT credit_usage_cost_positive
  CHECK (cost_usd >= 0);
