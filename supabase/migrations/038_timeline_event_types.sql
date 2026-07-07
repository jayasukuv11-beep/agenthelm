-- Migration 038: Expand timeline event types and allow NULL agent_id for system/reviewer actions

-- Step 1: Drop old check constraint if it exists
ALTER TABLE ai_timeline_events 
  DROP CONSTRAINT IF EXISTS ai_timeline_events_event_type_check;

-- Step 2: Re-create the constraint supporting the expanded Project Brain lifecycle
ALTER TABLE ai_timeline_events 
  ADD CONSTRAINT ai_timeline_events_event_type_check CHECK (event_type IN (
    'connected', 
    'disconnected', 
    'context_published',
    'context_injected', 
    'brain_version_created',
    'decision_made', 
    'error', 
    'file_ownership_blocked',
    'approval_requested', 
    'approval_granted', 
    'approval_rejected',
    'proposal_submitted',
    'proposal_rejected',
    'conflict_detected',
    'brain_compiled',
    'custom',
    -- New lifecycle events:
    'knowledge_published',
    'knowledge_archived',
    'knowledge_deleted',
    'knowledge_restored',
    'pipeline_failed',
    'pipeline_completed'
  ));

-- Step 3: Make agent_id nullable so system and human-reviewed events don't require an agent relation
ALTER TABLE ai_timeline_events 
  ALTER COLUMN agent_id DROP NOT NULL;
