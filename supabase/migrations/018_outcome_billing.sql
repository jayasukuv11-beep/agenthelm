-- Migration: 018_outcome_billing.sql
-- Description: Adds Outcome-Based Metering columns to shifts from tokens to business outcomes

-- 1. Track if a task has a fixed outcome fee upon success
ALTER TABLE agent_tasks 
  ADD COLUMN outcome_fee_usd DECIMAL(10,2) DEFAULT 0.00;

-- 2. Track outcome credits available per user (to fund successful runs)
-- Adding to `profiles` table
ALTER TABLE profiles 
  ADD COLUMN outcome_credits_balance DECIMAL(10,2) DEFAULT 0.00;

-- Note: Successful outcomes will deduct from outcome_credits_balance 
-- and insert a transaction into `credit_usage` with model="Outcome Fee"
