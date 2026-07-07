CREATE TABLE ai_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'connected', 'disconnected', 'context_published',
    'context_injected', 'brain_version_created',
    'decision_made', 'error', 'file_ownership_blocked',
    'approval_requested', 'approval_granted', 'approval_rejected'
  )),
  title TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_time ON ai_timeline_events USING BRIN(created_at) WITH (pages_per_range = 32);
CREATE INDEX idx_timeline_project ON ai_timeline_events(project_id, created_at DESC);

ALTER TABLE ai_timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_timeline" ON ai_timeline_events FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
ALTER PUBLICATION supabase_realtime ADD TABLE ai_timeline_events;
