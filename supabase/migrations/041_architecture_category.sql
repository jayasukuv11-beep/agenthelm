-- Migration 041: Ensure Architecture Category in Brain Entries
-- Note: Migration 031 (project_brain.sql) already includes 'architecture' in the category check constraint
-- This migration verifies the constraint exists and adds it if missing (idempotent)

DO $$
BEGIN
  -- Check if 'architecture' is already in the constraint
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'brain_entries'
      AND ccu.column_name = 'category'
      AND cc.check_clause ILIKE '%architecture%'
  ) THEN
    -- Add 'architecture' to the category check constraint
    ALTER TABLE brain_entries
    DROP CONSTRAINT IF EXISTS brain_entries_category_check;

    ALTER TABLE brain_entries
    ADD CONSTRAINT brain_entries_category_check
    CHECK (category IN (
      'architecture', 'decisions', 'goals', 'standards',
      'progress', 'changes', 'apis', 'database', 'testing', 'custom'
    ));

    RAISE NOTICE 'Added architecture to brain_entries category check constraint';
  ELSE
    RAISE NOTICE 'Architecture category already exists in brain_entries constraint';
  END IF;
END $$;