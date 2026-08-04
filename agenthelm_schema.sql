+-- AgentHelm application database schema
-- Source: Supabase project zuiceudkenboukonzdsu
-- Exported: 2026-08-03

CREATE TABLE public.agent_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  source text DEFAULT 'dashboard'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_chats_role_check CHECK (role = ANY (ARRAY['user'::text, 'agent'::text])),
  CONSTRAINT agent_chats_source_check CHECK (source = ANY (ARRAY['dashboard'::text, 'telegram'::text])),
  CONSTRAINT agent_chats_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT agent_chats_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_checkpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  step_index integer NOT NULL,
  step_name text,
  status text DEFAULT 'completed'::text,
  state_snapshot jsonb,
  state_delta jsonb,
  input_data jsonb,
  output_data jsonb,
  tokens_used integer DEFAULT 0,
  latency_ms integer,
  error_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  state_hash text,
  CONSTRAINT agent_checkpoints_status_check CHECK (status = ANY (ARRAY['running'::text, 'completed'::text, 'failed'::text, 'skipped'::text])),
  CONSTRAINT agent_checkpoints_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_checkpoints_task_id_fkey FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE,
  CONSTRAINT agent_checkpoints_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_commands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  command_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  delivered_at timestamp with time zone,
  delivery_attempts integer DEFAULT 0,
  CONSTRAINT agent_commands_command_type_check CHECK (command_type = ANY (ARRAY['stop'::text, 'start'::text, 'restart'::text, 'chat'::text, 'custom'::text, 'dispatch'::text])),
  CONSTRAINT agent_commands_status_check CHECK (status = ANY (ARRAY['pending'::text, 'delivering'::text, 'delivered'::text, 'completed'::text])),
  CONSTRAINT agent_commands_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_commands_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_commands ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_eval_results (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  eval_set_id uuid,
  agent_id uuid,
  passed boolean NOT NULL,
  tool_matches boolean NOT NULL,
  semantic_scores jsonb,
  tokens_used integer,
  latency_ms integer,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  agent_version text,
  CONSTRAINT agent_eval_results_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_eval_results_eval_set_id_fkey FOREIGN KEY (eval_set_id) REFERENCES agent_eval_sets(id) ON DELETE CASCADE,
  CONSTRAINT agent_eval_results_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_eval_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_eval_sets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agent_id uuid,
  name text NOT NULL,
  input_data jsonb NOT NULL,
  expected_tools text[],
  expected_output text,
  max_tool_calls integer DEFAULT 10,
  max_tokens integer DEFAULT 20000,
  judge_rubric jsonb,
  judge_model text DEFAULT 'gpt-4o-mini'::text,
  created_at timestamp with time zone DEFAULT now(),
  auto_generated boolean DEFAULT false,
  source_task_id uuid,
  CONSTRAINT agent_eval_sets_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_eval_sets_source_task_id_fkey FOREIGN KEY (source_task_id) REFERENCES agent_tasks(id),
  CONSTRAINT agent_eval_sets_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_eval_sets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_handoffs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_agent_id uuid,
  to_agent_id uuid,
  task_id uuid,
  payload jsonb,
  status text DEFAULT 'pending'::text,
  latency_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_handoffs_status_check CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'completed'::text, 'failed'::text])),
  CONSTRAINT agent_handoffs_from_agent_id_fkey FOREIGN KEY (from_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_handoffs_task_id_fkey FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE CASCADE,
  CONSTRAINT agent_handoffs_to_agent_id_fkey FOREIGN KEY (to_agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_handoffs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_handoffs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_interventions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  task_id uuid NOT NULL,
  type intervention_type NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  status intervention_status DEFAULT 'pending'::intervention_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_interventions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_interventions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_interventions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  type text DEFAULT 'log'::text,
  level text DEFAULT 'info'::text,
  message text NOT NULL,
  data jsonb,
  tokens_used integer DEFAULT 0,
  model text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_logs_level_check CHECK (level = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])),
  CONSTRAINT agent_logs_type_check CHECK (type = ANY (ARRAY['log'::text, 'error'::text, 'output'::text, 'tokens'::text, 'chat_reply'::text, 'progress'::text, 'tool_execution'::text, 'loop_detected'::text, 'injection'::text, 'hard_limit'::text, 'burn_rate'::text])),
  CONSTRAINT agent_logs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_logs_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_presence (
  agent_id uuid NOT NULL,
  status text DEFAULT 'idle'::text,
  current_task text,
  current_file text,
  progress_pct integer DEFAULT 0,
  heartbeat_at timestamp with time zone DEFAULT now(),
  ping_interval_ms integer DEFAULT 5000,
  session_model text,
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_presence_progress_pct_check CHECK (progress_pct >= 0 AND progress_pct <= 100),
  CONSTRAINT agent_presence_status_check CHECK (status = ANY (ARRAY['idle'::text, 'running'::text, 'thinking'::text, 'writing'::text, 'testing'::text, 'blocked'::text, 'error'::text, 'dead'::text])),
  CONSTRAINT agent_presence_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_presence_pkey PRIMARY KEY (agent_id)
);
ALTER TABLE public.agent_presence ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_reasoning_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid,
  task_id uuid,
  step_index integer NOT NULL,
  thought text,
  decision text,
  confidence double precision,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_reasoning_steps_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id),
  CONSTRAINT agent_reasoning_steps_task_id_fkey FOREIGN KEY (task_id) REFERENCES agent_tasks(id),
  CONSTRAINT agent_reasoning_steps_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_reasoning_steps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text,
  task_description text,
  status text DEFAULT 'pending'::text,
  result jsonb,
  source text DEFAULT 'dashboard'::text,
  progress_messages text[],
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  latency_ms integer,
  CONSTRAINT agent_tasks_source_check CHECK (source = ANY (ARRAY['telegram'::text, 'dashboard'::text])),
  CONSTRAINT agent_tasks_status_check CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'draft'::text, 'cancelled'::text])),
  CONSTRAINT agent_tasks_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT agent_tasks_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agent_tool_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  agent_id uuid,
  allowed_tools text[],
  block_mode boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_tool_permissions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT agent_tool_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT agent_tool_permissions_agent_id_key UNIQUE (agent_id)
);
ALTER TABLE public.agent_tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'idle'::text,
  agent_type text DEFAULT 'python'::text,
  version text,
  last_ping timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  project_id uuid,
  CONSTRAINT agents_agent_type_check CHECK (agent_type = ANY (ARRAY['python'::text, 'node'::text, 'other'::text])),
  CONSTRAINT agents_status_check CHECK (status = ANY (ARRAY['running'::text, 'idle'::text, 'stopped'::text, 'error'::text])),
  CONSTRAINT agents_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT agents_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT agents_pkey PRIMARY KEY (id)
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ai_timeline_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  agent_id uuid,
  event_type text NOT NULL,
  title text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_timeline_events_event_type_check CHECK (event_type = ANY (ARRAY['connected'::text, 'disconnected'::text, 'context_published'::text, 'context_injected'::text, 'brain_version_created'::text, 'decision_made'::text, 'error'::text, 'file_ownership_blocked'::text, 'approval_requested'::text, 'approval_granted'::text, 'approval_rejected'::text, 'proposal_submitted'::text, 'proposal_rejected'::text, 'conflict_detected'::text, 'brain_compiled'::text, 'custom'::text, 'knowledge_published'::text, 'knowledge_archived'::text, 'knowledge_deleted'::text, 'knowledge_restored'::text, 'pipeline_failed'::text, 'pipeline_completed'::text])),
  CONSTRAINT ai_timeline_events_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT ai_timeline_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT ai_timeline_events_pkey PRIMARY KEY (id)
);
ALTER TABLE public.ai_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.brain_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  brain_version_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  content_hash text NOT NULL,
  status text DEFAULT 'active'::text,
  tags text[],
  depends_on uuid[],
  source_type text NOT NULL,
  source_path text,
  confidence integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, ((title || ' '::text) || (content)::text))) STORED,
  superseded_by uuid,
  deprecated_at timestamp with time zone,
  evidence_score integer DEFAULT 100,
  validity_status text DEFAULT 'CURRENT'::text,
  stale_reason text,
  validated_at timestamp with time zone DEFAULT now(),
  validated_against_version integer,
  CONSTRAINT brain_entries_category_check CHECK (category = ANY (ARRAY['architecture'::text, 'decisions'::text, 'goals'::text, 'standards'::text, 'progress'::text, 'changes'::text, 'apis'::text, 'database'::text, 'testing'::text, 'custom'::text])),
  CONSTRAINT brain_entries_confidence_check CHECK (confidence >= 0 AND confidence <= 100),
  CONSTRAINT brain_entries_source_type_check CHECK (source_type = ANY (ARRAY['ai_proposal'::text, 'ai_contract'::text, 'git_commit'::text, 'documentation'::text, 'openapi'::text, 'schema'::text, 'human'::text])),
  CONSTRAINT brain_entries_status_check CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'deprecated'::text])),
  CONSTRAINT brain_entries_validity_status_check CHECK (validity_status = ANY (ARRAY['CURRENT'::text, 'NEEDS_REVIEW'::text, 'STALE'::text, 'SUPERSEDED'::text])),
  CONSTRAINT brain_entries_brain_version_id_fkey FOREIGN KEY (brain_version_id) REFERENCES brain_versions(id) ON DELETE CASCADE,
  CONSTRAINT brain_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT brain_entries_superseded_by_fkey FOREIGN KEY (superseded_by) REFERENCES brain_entries(id),
  CONSTRAINT brain_entries_pkey PRIMARY KEY (id)
);
ALTER TABLE public.brain_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.brain_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  version integer NOT NULL,
  parent_version integer,
  evolution_reason text NOT NULL,
  built_from_contracts uuid[],
  files_changed_count integer DEFAULT 0,
  apis_changed_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  built_from_proposals uuid[],
  entries_added_count integer DEFAULT 0,
  entries_deprecated_count integer DEFAULT 0,
  evidence_summary jsonb DEFAULT '{}'::jsonb,
  merge_plan jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT brain_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT brain_versions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.brain_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.credit_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid,
  tokens_used integer NOT NULL DEFAULT 0,
  model text,
  cost_usd numeric(10,8) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  cost_inr numeric(10,2) DEFAULT 0,
  CONSTRAINT credit_usage_cost_positive CHECK (cost_usd >= 0::numeric),
  CONSTRAINT credit_usage_tokens_positive CHECK (tokens_used >= 0),
  CONSTRAINT credit_usage_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT credit_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT credit_usage_pkey PRIMARY KEY (id)
);
ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.eval_regressions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid,
  eval_set_id uuid,
  baseline_version text NOT NULL,
  current_version text NOT NULL,
  metric text NOT NULL,
  baseline_value double precision NOT NULL,
  current_value double precision NOT NULL,
  delta double precision NOT NULL,
  threshold_used double precision NOT NULL,
  acknowledged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT eval_regressions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id),
  CONSTRAINT eval_regressions_eval_set_id_fkey FOREIGN KEY (eval_set_id) REFERENCES agent_eval_sets(id),
  CONSTRAINT eval_regressions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.eval_regressions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.injection_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  task_id uuid,
  input_text text,
  trust_score numeric(3,2),
  flags text[],
  action_taken text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT injection_events_action_taken_check CHECK (action_taken = ANY (ARRAY['allowed'::text, 'warned'::text, 'blocked'::text])),
  CONSTRAINT injection_events_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT injection_events_task_id_fkey FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE SET NULL,
  CONSTRAINT injection_events_pkey PRIMARY KEY (id)
);
ALTER TABLE public.injection_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.knowledge_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  content_hash text NOT NULL,
  summary text NOT NULL,
  decisions jsonb DEFAULT '[]'::jsonb,
  files_modified text[],
  apis_affected jsonb DEFAULT '[]'::jsonb,
  db_changes jsonb DEFAULT '[]'::jsonb,
  known_limitations text[],
  next_steps text[],
  tests_passed boolean DEFAULT false,
  human_reviewed boolean DEFAULT false,
  commit_sha text,
  branch text,
  author text,
  build_status text DEFAULT 'pending'::text,
  merged_into_version integer,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  conflict_detected boolean DEFAULT false,
  conflict_details jsonb DEFAULT '{}'::jsonb,
  evidence_score integer DEFAULT 0,
  reviewer_id uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  evidence_details jsonb DEFAULT '{}'::jsonb,
  merge_plan jsonb DEFAULT '{}'::jsonb,
  validation_errors text[] DEFAULT '{}'::text[],
  CONSTRAINT knowledge_proposals_build_status_check CHECK (build_status = ANY (ARRAY['pending'::text, 'processing'::text, 'reviewing'::text, 'merged'::text, 'rejected'::text])),
  CONSTRAINT context_contracts_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT context_contracts_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT knowledge_proposals_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id),
  CONSTRAINT context_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT context_contracts_content_hash_key UNIQUE (content_hash)
);
ALTER TABLE public.knowledge_proposals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  connect_key text NOT NULL,
  plan text DEFAULT 'free'::text,
  telegram_chat_id text,
  tokens_limit_monthly bigint DEFAULT 100000,
  plan_expires_at timestamp with time zone,
  onboarding_complete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notifications_prefs jsonb DEFAULT '{"agent_error": true, "token_spike": true, "agent_silent": true, "daily_summary": false, "credits_warning": true, "high_error_rate": true}'::jsonb,
  preferred_currency text DEFAULT 'USD'::text,
  CONSTRAINT profiles_plan_check CHECK (plan = ANY (ARRAY['free'::text, 'indie'::text, 'studio'::text])),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_connect_key_key UNIQUE (connect_key),
  CONSTRAINT profiles_email_key UNIQUE (email)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  repo_url text,
  brain_version integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  plan text NOT NULL DEFAULT 'free'::text,
  status text NOT NULL DEFAULT 'inactive'::text,
  order_id text,
  activated_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tool_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  task_id uuid,
  tool_name text NOT NULL,
  classification text NOT NULL,
  idempotency_key text,
  input_hash text,
  input_preview text,
  confirm_channel text DEFAULT 'telegram'::text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  status text DEFAULT 'executed'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tool_executions_classification_check CHECK (classification = ANY (ARRAY['read'::text, 'side_effect'::text, 'irreversible'::text])),
  CONSTRAINT tool_executions_confirm_channel_check CHECK (confirm_channel = ANY (ARRAY['telegram'::text, 'dashboard'::text])),
  CONSTRAINT tool_executions_status_check CHECK (status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'executed'::text, 'failed'::text, 'rejected'::text, 'timeout_rejected'::text])),
  CONSTRAINT tool_executions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  CONSTRAINT tool_executions_task_id_fkey FOREIGN KEY (task_id) REFERENCES agent_tasks(id) ON DELETE SET NULL,
  CONSTRAINT tool_executions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.tool_executions ENABLE ROW LEVEL SECURITY;
-- INDEXES
CREATE INDEX idx_agent_eval_results_agent ON public.agent_eval_results USING btree (agent_id);
CREATE INDEX idx_agent_eval_results_set ON public.agent_eval_results USING btree (eval_set_id);
CREATE INDEX idx_agent_eval_sets_agent ON public.agent_eval_sets USING btree (agent_id);
CREATE INDEX idx_agent_tasks_latency ON public.agent_tasks USING btree (latency_ms);
CREATE INDEX idx_agent_tool_permissions_agent ON public.agent_tool_permissions USING btree (agent_id);
CREATE INDEX idx_agents_last_ping ON public.agents USING btree (last_ping);
CREATE INDEX idx_agents_project ON public.agents USING btree (project_id);
CREATE INDEX idx_agents_status ON public.agents USING btree (status);
CREATE INDEX idx_agents_user_id ON public.agents USING btree (user_id);
CREATE INDEX idx_brain_entries_active_category ON public.brain_entries USING btree (project_id, category, title) WHERE (status = 'active'::text);
CREATE INDEX idx_brain_entries_project_status ON public.brain_entries USING btree (project_id, status);
CREATE INDEX idx_brain_entries_validity ON public.brain_entries USING btree (project_id, validity_status) WHERE (status = 'active'::text);
CREATE INDEX idx_brain_ver_latest ON public.brain_versions USING btree (project_id, version DESC);
CREATE INDEX idx_chats_agent_id ON public.agent_chats USING btree (agent_id);
CREATE INDEX idx_chats_created ON public.agent_chats USING btree (created_at DESC);
CREATE INDEX idx_checkpoints_agent ON public.agent_checkpoints USING btree (agent_id);
CREATE INDEX idx_checkpoints_hash ON public.agent_checkpoints USING btree (state_hash);
CREATE INDEX idx_checkpoints_task ON public.agent_checkpoints USING btree (task_id, step_index);
CREATE INDEX idx_commands_agent_pending ON public.agent_commands USING btree (agent_id, status) WHERE (status = 'pending'::text);
CREATE INDEX idx_contracts_files ON public.knowledge_proposals USING gin (files_modified);
CREATE INDEX idx_contracts_pending ON public.knowledge_proposals USING btree (build_status) WHERE (build_status = 'pending'::text);
CREATE INDEX idx_contracts_project_time ON public.knowledge_proposals USING btree (project_id, created_at DESC);
CREATE INDEX idx_credits_agent_id ON public.credit_usage USING btree (agent_id);
CREATE INDEX idx_credits_created ON public.credit_usage USING btree (created_at DESC);
CREATE INDEX idx_credits_user_id ON public.credit_usage USING btree (user_id);
CREATE INDEX idx_entries_project ON public.brain_entries USING btree (project_id);
CREATE INDEX idx_entries_search ON public.brain_entries USING gin (search_vector);
CREATE INDEX idx_entries_version ON public.brain_entries USING btree (brain_version_id, category);
CREATE INDEX idx_handoffs_from ON public.agent_handoffs USING btree (from_agent_id);
CREATE INDEX idx_handoffs_status ON public.agent_handoffs USING btree (status);
CREATE INDEX idx_handoffs_task ON public.agent_handoffs USING btree (task_id);
CREATE INDEX idx_handoffs_to ON public.agent_handoffs USING btree (to_agent_id);
CREATE INDEX idx_interventions_agent_task ON public.agent_interventions USING btree (agent_id, task_id);
CREATE INDEX idx_interventions_status ON public.agent_interventions USING btree (status);
CREATE INDEX idx_logs_agent_id ON public.agent_logs USING btree (agent_id);
CREATE INDEX idx_logs_created ON public.agent_logs USING btree (created_at DESC);
CREATE INDEX idx_logs_type ON public.agent_logs USING btree (type);
CREATE INDEX idx_projects_user ON public.projects USING btree (user_id);
CREATE INDEX idx_proposals_conflicts ON public.knowledge_proposals USING btree (project_id, conflict_detected, build_status);
CREATE INDEX idx_proposals_pending ON public.knowledge_proposals USING btree (project_id, build_status) WHERE (build_status = ANY (ARRAY['pending'::text, 'reviewing'::text]));
CREATE INDEX idx_tasks_agent_id ON public.agent_tasks USING btree (agent_id);
CREATE INDEX idx_tasks_status ON public.agent_tasks USING btree (status);
CREATE INDEX idx_tasks_user_id ON public.agent_tasks USING btree (user_id);
CREATE INDEX idx_timeline_project ON public.ai_timeline_events USING btree (project_id, created_at DESC);
CREATE INDEX idx_timeline_time ON public.ai_timeline_events USING brin (created_at) WITH (pages_per_range='32');
CREATE INDEX idx_tool_exec_agent ON public.tool_executions USING btree (agent_id);
CREATE INDEX idx_tool_exec_idemp ON public.tool_executions USING btree (idempotency_key);
CREATE INDEX idx_tool_exec_input_hash ON public.tool_executions USING btree (input_hash);
CREATE INDEX idx_tool_exec_status ON public.tool_executions USING btree (status);
CREATE INDEX idx_tool_exec_task ON public.tool_executions USING btree (task_id);
CREATE UNIQUE INDEX idx_brain_ver_unique ON public.brain_versions USING btree (project_id, version);
CREATE UNIQUE INDEX idx_tool_exec_idemp_unique ON public.tool_executions USING btree (agent_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE UNIQUE INDEX subscriptions_user_id_idx ON public.subscriptions USING btree (user_id);

-- ROW LEVEL SECURITY POLICIES
CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role manages handoffs" ON public.agent_handoffs AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete their own eval sets" ON public.agent_eval_sets AS PERMISSIVE FOR DELETE USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_eval_sets.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users can insert their own eval results" ON public.agent_eval_results AS PERMISSIVE FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_eval_results.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users can insert their own eval sets" ON public.agent_eval_sets AS PERMISSIVE FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_eval_sets.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users can only access interventions for their own agents" ON public.agent_interventions AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY "Users can update their own tool permissions" ON public.agent_tool_permissions AS PERMISSIVE FOR ALL USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_tool_permissions.agent_id) AND (agents.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_tool_permissions.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users can view own agent injection events" ON public.injection_events AS PERMISSIVE FOR SELECT USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = injection_events.agent_id) AND ((agents.user_id = auth.uid()) OR (auth.uid() IS NULL))))));
CREATE POLICY "Users can view own subscription" ON public.subscriptions AS PERMISSIVE FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own eval results" ON public.agent_eval_results AS PERMISSIVE FOR SELECT USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_eval_results.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users can view their own eval sets" ON public.agent_eval_sets AS PERMISSIVE FOR SELECT USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_eval_sets.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users can view their own tool permissions" ON public.agent_tool_permissions AS PERMISSIVE FOR SELECT USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE ((agents.id = agent_tool_permissions.agent_id) AND (agents.user_id = auth.uid())))));
CREATE POLICY "Users see own reasoning steps" ON public.agent_reasoning_steps AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY "Users see own regressions" ON public.eval_regressions AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY "Users view own handoffs" ON public.agent_handoffs AS PERMISSIVE FOR SELECT USING ((EXISTS ( SELECT 1
   FROM agents
  WHERE (((agents.id = agent_handoffs.from_agent_id) OR (agents.id = agent_handoffs.to_agent_id)) AND (agents.user_id = auth.uid())))));
CREATE POLICY users_own_agents ON public.agents AS PERMISSIVE FOR ALL USING ((user_id = auth.uid()));
CREATE POLICY users_own_brain_entries ON public.brain_entries AS PERMISSIVE FOR ALL USING ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));
CREATE POLICY users_own_brain_versions ON public.brain_versions AS PERMISSIVE FOR ALL USING ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));
CREATE POLICY users_own_chats ON public.agent_chats AS PERMISSIVE FOR ALL USING ((user_id = auth.uid()));
CREATE POLICY users_own_checkpoints ON public.agent_checkpoints AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY users_own_commands ON public.agent_commands AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY users_own_contracts ON public.knowledge_proposals AS PERMISSIVE FOR ALL USING ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));
CREATE POLICY users_own_credits ON public.credit_usage AS PERMISSIVE FOR ALL USING ((user_id = auth.uid()));
CREATE POLICY users_own_eval_sets ON public.agent_eval_sets AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY users_own_logs ON public.agent_logs AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY users_own_presence ON public.agent_presence AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));
CREATE POLICY users_own_profile ON public.profiles AS PERMISSIVE FOR ALL USING ((auth.uid() = id));
CREATE POLICY users_own_projects ON public.projects AS PERMISSIVE FOR ALL USING ((user_id = auth.uid()));
CREATE POLICY users_own_subscriptions ON public.subscriptions AS PERMISSIVE FOR ALL USING ((user_id = auth.uid()));
CREATE POLICY users_own_tasks ON public.agent_tasks AS PERMISSIVE FOR ALL USING ((user_id = auth.uid()));
CREATE POLICY users_own_timeline ON public.ai_timeline_events AS PERMISSIVE FOR ALL USING ((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))));
CREATE POLICY users_own_tool_executions ON public.tool_executions AS PERMISSIVE FOR ALL USING ((agent_id IN ( SELECT agents.id
   FROM agents
  WHERE (agents.user_id = auth.uid()))));

-- TRIGGERS
CREATE TRIGGER agenthelm AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://agenthelm.online/api/webhooks/supabase/signup', 'POST', '{"Content-type":"application/json","x-webhook-secret":"agenthelm2026"}', '{}', '5000');
CREATE TRIGGER brain_version_bump AFTER INSERT ON brain_versions FOR EACH ROW EXECUTE FUNCTION bump_brain_version();
CREATE TRIGGER set_connect_key BEFORE INSERT ON profiles FOR EACH ROW WHEN (new.connect_key IS NULL) EXECUTE FUNCTION generate_connect_key();
CREATE TRIGGER update_agent_interventions_updated_at BEFORE UPDATE ON agent_interventions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tool_executions_updated_at BEFORE UPDATE ON tool_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.bump_brain_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE projects SET brain_version = NEW.version, updated_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$function$


-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS plpgsql;
CREATE EXTENSION IF NOT EXISTS supabase_vault;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.generate_connect_key()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := 'ahe_live_';
  i INT;
BEGIN
  FOR i IN 1..16 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  NEW.connect_key := result;
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
