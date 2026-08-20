-- Migration 045: Atomic Credit Ledger & Deductions
-- Prevents race conditions in balance deductions and guarantees idempotency

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negative for debit, positive for refund/credit
  reason TEXT NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  related_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_credit_ledger" ON credit_ledger;
CREATE POLICY "users_own_credit_ledger" ON credit_ledger
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON credit_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_idempotency ON credit_ledger (idempotency_key);

-- Atomic deduction function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION deduct_credit(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key VARCHAR(255),
  p_agent_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inserted BOOLEAN := false;
  v_updated BOOLEAN := false;
BEGIN
  -- Insert into ledger with idempotency check
  INSERT INTO credit_ledger (user_id, amount, reason, idempotency_key, related_agent_id, related_project_id)
  VALUES (p_user_id, -ABS(p_amount), p_reason, p_idempotency_key, p_agent_id, p_project_id)
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- If this idempotency_key was already processed, treat as successful idempotent call
  IF NOT v_inserted THEN
    RETURN true;
  END IF;

  -- Atomic update of profile credits if balance suffices
  UPDATE profiles
  SET credits = credits - ABS(p_amount)
  WHERE id = p_user_id AND credits >= ABS(p_amount);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF NOT v_updated THEN
    -- Roll back the ledger insert because balance was insufficient
    DELETE FROM credit_ledger WHERE idempotency_key = p_idempotency_key;
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Atomic refund function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION refund_credit(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key VARCHAR(255),
  p_agent_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inserted BOOLEAN := false;
BEGIN
  INSERT INTO credit_ledger (user_id, amount, reason, idempotency_key, related_agent_id, related_project_id)
  VALUES (p_user_id, ABS(p_amount), p_reason, p_idempotency_key, p_agent_id, p_project_id)
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF NOT v_inserted THEN
    RETURN true;
  END IF;

  UPDATE profiles
  SET credits = credits + ABS(p_amount)
  WHERE id = p_user_id;

  RETURN true;
END;
$$;
