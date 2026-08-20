# AgentHelm — Production-Readiness Implementation Plan (v2)

This implementation plan addresses the 18 identified problems plus 5 retention features, 2 Sarvam partnership deepening features, full business logic, migration strategy, and a comprehensive verification plan across 7 phases to make AgentHelm enterprise-ready, customer-retaining, and commercially viable.

## User Review Required

> [!IMPORTANT]
> **Key Architectural Upgrades:**
> 1. **Authentication Migration**: Connect keys will now be SHA-256 hashed in a new `api_keys` table. To maintain backward compatibility during rollout, the SDK gateway supports both hashed API keys and existing profile connect keys.
> 2. **Dedicated JWT Secret**: `AGENTHELM_JWT_SECRET` is now required for signing agent JWTs (falling back only in development/build test environments).
> 3. **Sarvam AI Architecture**: All Sarvam LLM calls use model `sarvam-105b` with strict JSON schema outputs, a 5-second `AbortController` timeout, and a resilient deterministic fallback so pipeline operations never break if Sarvam is slow or unavailable.
> 4. **Brain Compiler 8 Stages**: The pipeline expands from 6 to 8 stages (`intake` → `policy` → `classify` → `verify` → `validate` → `analyze` → `plan` → `build`) with full observability of AI vs deterministic execution.
> 5. **Document Intelligence + Translation**: Sarvam's Document Intelligence API extracts structured knowledge from uploaded files (diagrams, specs, schemas). Sarvam Translation normalizes multilingual knowledge entries to a canonical language while preserving originals.
> 6. **Business Logic**: Three pricing tiers (Free, Pro, Team) with credit-based usage limits, plan-gated features, and an onboarding flow that seeds the brain on first connect.
> 7. **Retention Features**: Brain seeding (auto-extract from repo), "Agent Saved You Time" metric, cross-agent insights, and brain export/import.

---

## Proposed Changes

### Phase 1: Security (P0 & P1 Vulnerabilities)

#### 1.1 Migrate Sarvam-30B to Sarvam-105B & Shared Client
- **[NEW] `lib/brain/providers/sarvam-client.ts`**:
  - Central client for calling `https://api.sarvam.ai/v1/chat/completions`.
  - Default model: `"sarvam-105b"`.
  - Configurable `reasoning_effort` (`"low"` / `"medium"` / `"high"`).
  - 5-second `AbortController` timeout.
  - JSON schema enforcement via `response_format: { type: "json_schema", json_schema: {...} }`.
  - Deterministic fallback: returns `null` on timeout, HTTP error, or invalid payload.
  - Shared `callSarvamJson<T>(messages, schema, options)` function used by all Sarvam provider modules.
- **[MODIFY] `lib/brain/providers/sarvam-promotion.ts`**:
  - Use `callSarvamJson()` from `sarvam-client.ts`.
  - Remove manual markdown stripping and regex replaces.
  - Keep `classifyObservation()` as a thin wrapper (still used during the transition period, will be deprecated once `sarvam-classify.ts` is fully wired).

#### 1.2 SDK Auth Gateway Middleware
- **[NEW] `lib/middleware/sdk-gateway.ts`**:
  - Exports `withSdkAuth<TBody>(handler, options)`:
    - Extracts token exclusively from `Authorization: Bearer <token>` header (disallows query params).
    - Rate limits via Upstash Redis (writes: 60/min, reads: 120/min).
    - Validates key via SHA-256 hash in `api_keys` (or legacy fallback to `profiles.connect_key` during transition).
    - Validates request body using Zod schemas (`options.schema`).
    - If `requireAgentId: true`: enforces agent ownership (`authorizeSdkAgent()`).
    - If `requireProjectId: true`: enforces project ownership.
    - Applies strict CORS headers (allowed origins only, no wildcard `*`).
    - Passes typed `AuthorizedContext` `{ userId, agentId, projectId, plan, supabase, body }` to route handler.
- **[MODIFY] 22 SDK Routes under `app/api/sdk/`**:
  - Replace manual authentication and `validateConnectKey()` with `withSdkAuth()`.
  - Write routes: `log`, `memory`, `output`, `state`, `checkpoint`, `tasks`, `tasks/claim`, `tasks/complete`, `presence/claim`, `interventions`, `execution`, `traces`, `timeline/batch`.
  - Read routes: `inject`, `proposals`, `injection`, `replay`, `contracts`, `evals/from-trace`, `evals/judge`, `evals/regression`, `evals/results`.
  - Remove wildcard CORS and strip query param auth.

#### 1.3 Replace Plaintext Connect Keys with Hashed API Keys
- **[NEW] `supabase/migrations/043_api_keys.sql`**:
  - `api_keys` table: `id`, `user_id`, `key_prefix`, `key_hash` (SHA-256, UNIQUE), `name`, `scope`, `agent_id`, `project_id`, `expires_at`, `last_used_at`, `revoked_at`, `created_at`.
  - RLS policy: `user_id = auth.uid()`.
  - Partial index: `CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL`.
- **[MODIFY] `lib/sdk-auth.ts`**:
  - Update `validateConnectKey()` to hash incoming key with `crypto.createHash('sha256')` and check `api_keys` first, then fall back to `profiles.connect_key` (legacy) during transition.
  - Fire-and-forget update of `last_used_at`.

#### 1.4 Dedicated JWT Signing Secret
- **[MODIFY] `lib/sdk-auth.ts`**:
  - Require `process.env.AGENTHELM_JWT_SECRET` (256-bit).
  - Add `kid` in protected header and `jti` (`crypto.randomUUID()`) in payload.
  - Set expiration to `1h`.
- **[MODIFY] `.env.example`**:
  - Document `AGENTHELM_JWT_SECRET`.

#### 1.5 Supabase RLS Hardening
- **[NEW] `supabase/migrations/044_rls_hardening.sql`**:
  - Drop permissive `USING (true)` policies on `agent_handoffs` and `subscriptions`.
  - Add proper `user_id = auth.uid()` policies.
  - Revoke `EXECUTE` on `handle_new_user()` and `rls_auto_enable()` from `PUBLIC, anon, authenticated`.
  - Set safe `search_path = safe, public, pg_temp` on `update_updated_at_column`, `bump_brain_version`, `generate_connect_key`, `handle_new_user`.

#### 1.6 Atomic Credit Deductions & Ledger
- **[NEW] `supabase/migrations/045_credit_ledger.sql`**:
  - `credit_ledger` table with `idempotency_key UNIQUE`.
  - `deduct_credit()` stored procedure with atomic deduction and ledger insert.
  - `refund_credit()` stored procedure for rollbacks.
- **[MODIFY] `app/api/sdk/log/route.ts`**:
  - Use `supabaseAdmin.rpc('deduct_credit', ...)` with idempotency key.

---

### Phase 2: Brain Compiler & Sarvam Intelligence

#### 2.1 Rich Proposal Classification (Stage 3)
- **[NEW] `lib/brain/providers/sarvam-classify.ts`**:
  - `classifyProposal(proposal)` using Sarvam-105B structured output.
  - Returns category, risk level (`low`, `medium`, `high`), action, confidence, summary for brain, semantic tags.
  - Fallback logic when Sarvam is unavailable.
- **[NEW] Column additions in migration** (folded into `047_brain_enhancements.sql`):
  - Add `sarvam_category`, `sarvam_risk_level`, `sarvam_confidence`, `sarvam_summary`, `semantic_tags` to `knowledge_proposals`.

#### 2.2 Policy Engine (Stage 2)
- **[NEW] `lib/brain/policy-engine.ts`**:
  - `evaluatePolicy(proposal, config, evidenceScore)` returning `PolicyResult`.
  - Hardcoded backstop: immediate reject on prompt injection / credential leaks.
  - Modes: `disabled`, `shadow`, `gated`, `auto`.
  - Fail-safe default: `"review"`.
- **[NEW] `supabase/migrations/046_policy_engine.sql`**:
  - `project_policies` table and `policy_audit_log` table.

#### 2.3 Semantic Conflict Detection
- **[NEW] `lib/brain/providers/sarvam-semantic.ts`**:
  - `analyzeSemanticRelation(proposedEntry, existingEntry)`.
- **[MODIFY] `lib/brain/knowledge-analyzer.ts`**:
  - Make conflict detection async: Tier 1 bigram fast filter + Tier 2 Sarvam semantic analyzer for 0.3–0.85 similarity range.

#### 2.4 Evidence Quality Assessment
- **[NEW] `lib/brain/providers/sarvam-evidence.ts`**:
  - `assessEvidenceQuality(proposal, baseScore)` returning qualitative score & risk factors.
- **[MODIFY] `lib/brain/pipeline.ts`**:
  - Call in `doVerify()` to enrich deterministic scoring.

#### 2.5 Intelligent Dependency Mapping
- **[NEW] `lib/brain/providers/sarvam-dependencies.ts`**:
  - `analyzeDependencies(newEntry, existingEntries)` batch Sarvam call.
- **[MODIFY] `lib/brain/knowledge-analyzer.ts`**:
  - Integrated into knowledge analyzer with deterministic fallback.

#### 2.6 Semantic Context Retrieval
- **[NEW] `lib/brain/providers/sarvam-context.ts`**:
  - `semanticReRank(taskHint, entries)` for top 20 candidates.
- **[MODIFY] `app/api/sdk/inject/route.ts`**:
  - Hybrid scoring: 70% semantic score + 30% deterministic score.

#### 2.7 Dedicated Staleness Function
- **[NEW] `lib/brain/providers/sarvam-staleness.ts`**:
  - `analyzeStaleness(newEntry, existingEntry)`.
- **[MODIFY] `lib/brain/staleness-analyzer.ts`**:
  - Use `analyzeStaleness()` and set status to `NEEDS_REVIEW`.

#### 2.8 Pipeline Redesign (8 Stages)
- **[MODIFY] `lib/brain/pipeline.ts` & `lib/brain/types.ts`**:
  - 8 stages: `intake` → `policy` → `classify` → `verify` → `validate` → `analyze` → `plan` → `build`.
  - Record per-stage `sarvam_used`, `fallback_used`, and execution time.

---

### Phase 3: Frontend Polish & Dashboard Completion

#### 3.1 Unified Design System
- **[MODIFY] `app/globals.css` & `tailwind.config.ts`**:
  - Warm paper color system: `--paper`, `--paper-dim`, `--paper-card`, `--ink`, `--ink-soft`, `--muted`, `--line`, `--vermilion`, `--moss`, `--amber`, `--sarvam`.
- **[MODIFY] `app/layout.tsx`**:
  - Add Space Grotesk font alongside Inter and JetBrains Mono.

#### 3.2 Editorial Landing Page
- **[MODIFY] `app/page-client.tsx` & `components/landing/*`**:
  - Asymmetric 7/5 hero grid with live terminal simulator.
  - Editorial manifesto section with typography pull quotes.
  - 8-stage Brain Compiler pipeline with Sarvam AI badges.
  - Policy engine interactive demo and side-by-side SDK snippets.
  - Pricing section showing Free / Pro / Team tiers (see Phase 5 business logic).
  - Footer with "Powered by Sarvam AI".

#### 3.3 Dashboard Pages & Component Integration
- **[MODIFY] `app/(dashboard)/layout.tsx`**:
  - Warm paper sidebar navigation with Sarvam pill indicator.
- **[MODIFY/NEW] Dashboard Routes**:
  - Overview (`/dashboard`), Proposals (`/dashboard/proposals`), Knowledge (`/dashboard/knowledge`), Versions (`/dashboard/versions`), Policy (`/dashboard/policy`), Agents (`/dashboard/agents`), Settings (`/dashboard/settings`).
  - Integrate `ProjectBrainPanel` and `KnowledgeProposalsPanel`.
  - Remove deprecated/unused panels (`AITimelinePanel`, `AgentPresenceGrid`).

---

### Phase 4: Type Safety & Zod Schemas

#### 4.1 Zod Schemas
- **[NEW] `lib/schemas/sdk-schemas.ts`**:
  - Strongly typed Zod schemas for all SDK route request payloads (`logSchema`, `injectSchema`, `proposalSchema`, `checkpointSchema`, `handoffSchema`, `reasoningSchema`, etc.).
  - Fix step index validation: `z.number().int().min(0)`.
- **[MODIFY] SDK Routes**:
  - Consume validated `body` from `withSdkAuth()`, eliminating `any` casts.

---

### Phase 5: Retention Features & Business Logic

#### 5.1 Brain Seeding — Instant Value on First Connect

When a developer connects a GitHub repo, AgentHelm scans it for knowledge-worthy files and auto-proposes entries. The brain is populated before the first agent runs.

- **[NEW] `lib/brain/brain-seeder.ts`**:
  - `seedBrainFromRepo(projectId, repoUrl)` function.
  - Fetches these file types via GitHub API (unauthenticated for public repos, token for private):
    - `README.md` → extract architecture overview, tech stack, setup steps → 2-3 entries (category: `architecture`)
    - `openapi.yaml` / `openapi.json` / `swagger.yaml` → extract endpoints, schemas → 1 entry per resource group (category: `api`)
    - `schema.sql` / `prisma/schema.prisma` / `drizzle/schema.ts` → extract tables, columns, relations → 1 entry per table (category: `database`)
    - `.cursorrules` / `CLAUDE.md` / `AGENTS.md` → extract conventions → 1-2 entries (category: `standards`)
    - `docker-compose.yml` / `Dockerfile` → extract infrastructure → 1 entry (category: `infrastructure`)
  - For each extracted entity, create a `KnowledgeProposal` with:
    - `summary_for_brain` generated by Sarvam-105B (structured output)
    - `category` inferred from source file type
    - `risk_level` set to `"low"` (seeded entries start low-risk)
    - `evidence` includes `{ source: "repo_seed", file: <filename> }`
    - `agent_id` set to a reserved `system-seeder` agent
  - All seeded proposals go through the normal pipeline (policy → classify → verify → validate → analyze → plan → build).
  - With default policy mode `"gated"`, seeded entries require developer review (they see value immediately, but stay in control).
  - With policy mode `"auto"`, seeded entries with low risk auto-apply — the brain is populated instantly.
  - Returns `SeedingResult { entries_proposed, entries_auto_applied, entries_gated, errors[] }`.

- **[NEW] `app/api/integrations/github/seed/route.ts`**:
  - POST endpoint (authenticated via dashboard session, not SDK auth).
  - Accepts `{ project_id, repo_url, github_token? }`.
  - Calls `seedBrainFromRepo()`.
  - Returns seeding result for dashboard display.

- **[MODIFY] Dashboard Overview page**:
  - When a project has 0 brain entries, show a "Seed your brain" CTA with repo URL input.
  - After seeding, show: "14 entries extracted from your repo — review them" with a link to the Proposals page.

- **[NEW] `lib/brain/providers/sarvam-extract.ts`** (used by brain seeder):
  - `extractKnowledgeFromFile(filename, content)` using Sarvam-105B.
  - Returns array of `{ summary, category, key_facts[], dependencies[] }`.
  - For large files (>10K tokens), chunk by section/heading and process each chunk.
  - Fallback: regex-based extraction (crude but functional) — extract headings, code blocks, table names.

#### 5.2 "Agent Saved You Time" Metric — Visible ROI

Track and surface how much agent reasoning time the brain saves. Every `get_context` call that returns non-empty results is a "saved time" event.

- **[NEW] `supabase/migrations/047_retention_tables.sql`**:
  ```sql
  CREATE TABLE context_injections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    task_hint TEXT,
    entries_returned INTEGER NOT NULL DEFAULT 0,
    tokens_returned INTEGER NOT NULL DEFAULT 0,
    estimated_seconds_saved INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  -- RLS: user owns project owns agent
  CREATE INDEX idx_context_injections_project ON context_injections(project_id, created_at DESC);
  ```

- **[MODIFY] `app/api/sdk/inject/route.ts`**:
  - After returning context to the agent, insert a `context_injections` row.
  - `entries_returned` = number of brain entries sent.
  - `tokens_returned` = token count of the response.
  - `estimated_seconds_saved` = `entries_returned * 45` (heuristic: each relevant entry saves ~45 seconds of agent reasoning). This is a rough estimate, not a precise measurement — label it as "estimated" in the UI.

- **[NEW] `lib/analytics/time-saved.ts`**:
  - `getTimeSavedStats(projectId, range: "7d" | "30d" | "all")` → `{ total_seconds, total_injections, total_entries_served, daily_breakdown[] }`.
  - `getDuplicatePreventionCount(projectId, range)` — counts proposals where conflict detection found a duplicate (saved the agent from proposing redundant knowledge).

- **[MODIFY] Dashboard Overview page**:
  - Add "Time Saved" card showing: `This week, your brain saved ~4.2 hours of agent reasoning time` with breakdown:
    - `23 context injections served relevant knowledge`
    - `5 duplicate proposals prevented`
    - `2 stale entries caught before they caused errors`
  - Daily breakdown sparkline showing injections per day.

#### 5.3 Cross-Agent Insights — Network Effect Visibility

Show developers which agents contributed what, and when one agent's knowledge was used by another agent.

- **[MODIFY] `context_injections` table** (from 5.2):
  - The `agent_id` on each injection row records which agent consumed the knowledge.
  - Brain entries already have `proposed_by` (agent_id) from the proposals table.
  - Cross-reference: "Agent A proposed entry X, Agent B consumed it" = knowledge transfer.

- **[NEW] `lib/analytics/cross-agent.ts`**:
  - `getCrossAgentInsights(projectId, range: "7d" | "30d")` →:
    ```typescript
    {
      agent_contributions: [{ agent_id, agent_name, proposals_count, auto_applied, gated, rejected }],
      knowledge_transfers: [{ from_agent, to_agent, entry_count, last_transfer_at }],
      top_shared_entries: [{ entry_id, summary, consumed_by_count, proposed_by_agent }]
    }
    ```

- **[MODIFY] Dashboard Agents page (`/dashboard/agents`)**:
  - Add "Cross-Agent Insights" section:
    - Agent contributions table: each agent's proposal count, auto-applied vs gated vs rejected.
    - Knowledge transfer matrix: "Claude Code → Cursor: 8 entries shared" with timestamps.
    - Top shared entries: "Rate limiting pattern — used by 3 agents, 12 times."

#### 5.4 Brain Export/Import — Reduces Switching Cost Anxiety

- **[NEW] `app/api/brain/export/route.ts`** (dashboard-authenticated):
  - GET endpoint: `GET /api/brain/export?project_id=...&format=json`.
  - Returns a JSON file containing:
    ```json
    {
      "schema_version": "1.0",
      "project": { "name": "...", "exported_at": "..." },
      "brain_versions": [...],
      "brain_entries": [...],
      "knowledge_proposals": [...],
      "policy_config": {...},
      "stats": { "total_entries": 42, "total_versions": 7 }
    }
    ```
  - Stream as file download (`Content-Disposition: attachment`).
  - Include all version history (not just current version).

- **[NEW] `app/api/brain/import/route.ts`** (dashboard-authenticated):
  - POST endpoint: accepts JSON file upload.
  - Validates schema version, then:
    - Creates new brain entries (with `imported: true` flag on `metadata`).
    - Preserves version history as a single "imported" version bump.
    - Does NOT overwrite existing entries — imported entries are appended.
    - Runs conflict detection on imported entries against existing brain.
  - Returns import summary: `entries_imported, conflicts_detected, version_created`.

- **[MODIFY] Dashboard Settings page**:
  - Add "Brain Management" section:
    - "Export Brain" button → triggers download.
    - "Import Brain" file upload → processes and shows summary.
    - Warning text: "Imported entries are appended to your current brain. Conflicts will be flagged for review."

#### 5.5 Business Logic — Pricing, Plans, Usage Limits

- **[NEW] `supabase/migrations/048_business_logic.sql`**:
  ```sql
  -- Subscription plans
  CREATE TABLE subscription_plans (
    id TEXT PRIMARY KEY,  -- 'free', 'pro', 'team'
    name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL DEFAULT 0,  -- in paise (Indian rupees * 100)
    price_yearly INTEGER NOT NULL DEFAULT 0,
    credits_monthly INTEGER NOT NULL,  -- Sarvam API call budget
    max_agents INTEGER NOT NULL,
    max_projects INTEGER NOT NULL,
    max_brain_entries INTEGER NOT NULL,  -- -1 = unlimited
    features JSONB NOT NULL DEFAULT '{}',
    stripe_equivalent TEXT,  -- for Cashfree mapping
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  INSERT INTO subscription_plans VALUES
    ('free', 'Free', 0, 0, 100, 1, 1, 50,
     '{"brain_seeding": true, "export": true, "telegram_notifications": false, "cross_agent": false, "policy_engine": "gated_only", "sarvam_calls_per_day": 100}',
     NULL),
    ('pro', 'Pro', 49900, 499900, 2000, 3, 3, 500,
     '{"brain_seeding": true, "export": true, "telegram_notifications": true, "cross_agent": true, "policy_engine": "all_modes", "sarvam_calls_per_day": 1000, "document_intelligence": true, "translation": true}',
     NULL),
    ('team', 'Team', 199900, 1999900, 10000, 10, 10, -1,
     '{"brain_seeding": true, "export": true, "telegram_notifications": true, "cross_agent": true, "policy_engine": "all_modes", "sarvam_calls_per_day": 5000, "document_intelligence": true, "translation": true, "sso": false, "audit_log_export": true}',
     NULL);

  -- User subscriptions (links to Cashfree subscription ID)
  CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'past_due', 'canceled', 'trialing'
    cashfree_subscription_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    credits_used_this_period INTEGER NOT NULL DEFAULT 0,
    credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- RLS: user owns their subscription
  ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "users_own_subscriptions" ON user_subscriptions
    FOR ALL USING (user_id = auth.uid());

  -- Usage tracking (for enforcing limits)
  CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,  -- 'sarvam_call', 'get_context', 'propose_knowledge', 'brain_seed', 'doc_intelligence', 'translation'
    credits_cost INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX idx_usage_events_user_date ON usage_events(user_id, created_at DESC);
  CREATE INDEX idx_usage_events_type ON usage_events(event_type, created_at DESC);

  -- RLS: user owns their usage events
  ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "users_own_usage" ON usage_events FOR ALL USING (user_id = auth.uid());
  ```

- **[NEW] `lib/billing/plans.ts`**:
  - `getPlanForUser(userId)` → returns `SubscriptionPlan` with features and limits.
  - `checkUsageLimit(userId, eventType)` → boolean (has the user hit their limit for this event type today/month?).
  - `recordUsage(userId, eventType, creditsCost, metadata?)` → inserts `usage_events` row, increments `user_subscriptions.credits_used_this_period`.
  - `getCreditsRemaining(userId)` → `plan.credits_monthly - subscription.credits_used_this_period`.
  - Credit costs per event type:
    - `get_context` → 0 credits (free, encourages usage)
    - `propose_knowledge` → 1 credit (pipeline processing)
    - `sarvam_call` → 1 credit (any direct Sarvam API call)
    - `brain_seed` → 5 credits per file processed
    - `doc_intelligence` → 3 credits per document
    - `translation` → 2 credits per entry translated

- **[NEW] `lib/billing/cashfree.ts`**:
  - `createSubscription(userId, planId)` → creates Cashfree subscription, stores `cashfree_subscription_id`.
  - `handleWebhook(payload, signature)` → verifies Cashfree webhook signature, updates `user_subscriptions` status.
  - `cancelSubscription(userId, immediately?)` → cancels via Cashfree API, updates local status.

- **[NEW] `app/api/billing/subscribe/route.ts`**:
  - POST: creates Cashfree subscription, returns payment URL.

- **[NEW] `app/api/billing/webhook/route.ts`**:
  - POST: Cashfree webhook handler (subscription activated, payment failed, etc.).

- **[NEW] `app/api/billing/usage/route.ts`**:
  - GET: returns current plan, credits used, credits remaining, usage breakdown by event type.

- **[MODIFY] `lib/middleware/sdk-gateway.ts`**:
  - After auth, load user's plan via `getPlanForUser()`.
  - Before passing to handler, check usage limits:
    - If plan is `free` and agent count > `max_agents` → reject with 403.
    - If plan is `free` and project count > `max_projects` → reject with 403.
    - If brain entries count > `max_brain_entries` → reject `propose_knowledge` with 403 (upgrade prompt).
    - If `credits_remaining <= 0` → reject Sarvam-dependent operations with 402.
  - Pass `plan` and `creditsRemaining` in `AuthorizedContext`.

- **[MODIFY] Dashboard Settings page**:
  - "Billing" section:
    - Current plan card with credits used / remaining (visual progress bar).
    - Usage breakdown: `get_context: 234 calls, propose_knowledge: 45 calls, sarvam: 89 calls`.
    - "Upgrade to Pro" / "Upgrade to Team" buttons (→ Cashfree checkout).
    - "Manage Subscription" link (→ Cashfree portal).
  - "API Keys" section:
    - List of API keys with `key_prefix`, `name`, `last_used_at`, `created_at`.
    - "Create New Key" → generates key, shows ONCE, stores hash.
    - "Revoke" button per key.

- **[MODIFY] Landing page pricing section**:
  - Three-column pricing comparison (Free / Pro / Team).
  - Feature comparison table.
  - "Powered by Cashfree" payment trust badge.
  - Prices in ₹ (Indian market): Free / ₹499/mo Pro / ₹1,999/mo Team.

- **[NEW] Onboarding flow**:
  - `app/(dashboard)/onboarding/page.tsx`:
    - Step 1: Create your first project (name + description).
    - Step 2: Connect a GitHub repo (optional) → triggers brain seeding.
    - Step 3: Generate API key → shows key once → copy.
    - Step 4: Install SDK (show pip/npm install command + code snippet).
    - Step 5: Run first agent → "Check your dashboard in a few minutes."
  - Redirect new signups to `/onboarding` until they have at least 1 project and 1 API key.

---

### Phase 6: Sarvam Partnership Deepening

#### 6.1 Document Intelligence — Upload Files to Extract Knowledge

Allow developers to upload design docs, architecture diagrams, API specs, and database schemas. Sarvam Vision extracts text from images, Sarvam-105B structures the extracted content into knowledge proposals.

- **[NEW] `lib/sarvam/document-intelligence.ts`**:
  - `extractFromDocument(file: Buffer, mimeType: string, filename: string)`:
    - If image (PNG/JPEG): call Sarvam Vision API for OCR + layout extraction.
    - If text (MD/TXT/YAML/JSON): read content directly.
    - If PDF: use Sarvam Vision on each page (or extract text if text-based PDF).
  - Returns `RawExtraction { text, pages?, tables?, images? }`.
  - Then call Sarvam-105B with structured output to classify and extract knowledge entities:
    - `extractKnowledgeEntities(rawExtraction, filename)` → array of `{ summary, category, key_facts[], dependencies[], risk_level }`.
  - Fallback: regex-based extraction (headings, code blocks, table names from SQL).

- **[NEW] `app/api/brain/upload/route.ts`** (dashboard-authenticated):
  - POST: accepts multipart form upload (file + project_id).
  - File size limit: 10MB (free), 50MB (pro/team).
  - File types: `.md`, `.txt`, `.yaml`, `.yml`, `.json`, `.png`, `.jpeg`, `.jpg`, `.pdf`, `.sql`, `.prisma`.
  - Calls `extractFromDocument()` → `extractKnowledgeEntities()`.
  - Creates proposals for each entity (goes through normal pipeline).
  - Records usage: `doc_intelligence` event, 3 credits.
  - Returns: `{ entities_extracted, proposals_created, proposals_auto_applied, proposals_gated }`.

- **[MODIFY] Dashboard Knowledge page**:
  - Add "Upload Document" button (file picker + drag-and-drop zone).
  - After upload, show extraction progress: "Extracting from architecture-diagram.png..."
  - Show results: "5 knowledge entries extracted — 3 auto-applied, 2 need review."
  - Link to Proposals page for gated items.

- **[MODIFY] Landing page Sarvam partnership section**:
  - Add "Document Intelligence" as a featured capability.
  - Show example: architecture diagram → extracted brain entries (visual before/after).

#### 6.2 Translation — Multilingual Knowledge Normalization

For Indian development teams where agents write in mixed languages (Hindi comments, English docs, Tamil variable names), normalize knowledge entries to a canonical language while preserving originals.

- **[NEW] `lib/sarvam/translation.ts`**:
  - `translateEntry(summary: string, targetLang: string)`:
    - Calls Sarvam Translation API.
    - Returns `{ translated_text, source_language_detected, confidence }`.
  - `detectLanguage(text: string)`:
    - Calls Sarvam Translation API with `detect_only: true`.
    - Returns ISO 639-1 language code.
  - Fallback: if Sarvam Translation is down, return original text with `translated: false`.

- **[MODIFY] `lib/brain/pipeline.ts` doClassify()**:
  - After Sarvam classification, detect language of `summary_for_brain`.
  - If detected language is not English (canonical):
    - Call `translateEntry(summary, "en")`.
    - Store both: `original_text` and `translated_text` on the brain entry.
    - Set `metadata.translated = true` and `metadata.source_language = detected`.
  - If language is already English: skip translation (no API call, no credits).

- **[NEW] Column additions** (folded into `047_retention_tables.sql`):
  ```sql
  ALTER TABLE brain_entries ADD COLUMN original_text TEXT;
  ALTER TABLE brain_entries ADD COLUMN translated_text TEXT;
  ALTER TABLE brain_entries ADD COLUMN source_language TEXT;
  ALTER TABLE brain_entries ADD COLUMN is_translated BOOLEAN NOT NULL DEFAULT false;
  ```

- **[MODIFY] `lib/brain/providers/sarvam-context.ts`**:
  - When returning context, include both `original_text` and `translated_text` if available.
  - The `translated_text` is what the agent primarily sees; `original_text` is metadata.

- **[MODIFY] Dashboard Knowledge page**:
  - Entries with `is_translated = true` show a small badge: "Translated from Hindi" (or detected language).
  - Clicking the badge toggles between translated and original text.
  - Settings: "Auto-translate non-English entries" toggle (default: ON for pro/team, OFF for free).

- **[MODIFY] Landing page**:
  - Add "Multilingual Support" callout in the Sarvam partnership section.
  - Example: "Agent proposes: 'एथेंटिकेशन के लिए JWT का उपयोग करें' → Brain stores: 'Use JWT for authentication' (translated, original preserved)."

---

## Migration Strategy

### Overview

The migration must be zero-downtime: existing users' agents keep working throughout the transition. The strategy is **dual-auth during transition**, **backfill for new columns**, and **progressive feature rollout**.

### Step 1: Database Migrations (Run in Order)

All migrations are forward-compatible — they add tables/columns without removing or renaming existing ones.

| Order | Migration | What it does | Breaking? |
|-------|-----------|-------------|-----------|
| 1 | `043_api_keys.sql` | Creates `api_keys` table. Old `profiles.connect_key` remains untouched. | No — additive. |
| 2 | `044_rls_hardening.sql` | Drops permissive policies, adds proper ones. Revokes function execute. | Low risk — fixes security holes. Test that existing queries still work with new RLS policies. |
| 3 | `045_credit_ledger.sql` | Creates `credit_ledger`, `deduct_credit()`, `refund_credit()`. Old credit logic still works. | No — additive. |
| 4 | `046_policy_engine.sql` | Creates `project_policies`, `policy_audit_log`. | No — additive. |
| 5 | `047_retention_tables.sql` | Creates `context_injections`, `usage_events`. Adds columns to `knowledge_proposals` and `brain_entries`. | No — additive. All new columns are nullable/defaulted. |
| 6 | `048_business_logic.sql` | Creates `subscription_plans` (with seed data), `user_subscriptions`, `usage_events`. | No — additive. |

**Critical:** Run migration 2 (RLS hardening) during a low-traffic window. After running, verify that:
- Existing dashboard queries still return data (user can see their own projects, agents, brain entries).
- SDK routes still work with current connect keys (legacy fallback).
- No queries error on the new RLS policies.

### Step 2: Connect Key Migration (Dual-Auth Period)

**Phase A — Deploy with dual-auth (Week 1):**
- `validateConnectKey()` checks `api_keys` table first (SHA-256 hash lookup), then falls back to `profiles.connect_key` (plaintext lookup).
- Both paths work simultaneously. No user is broken.
- All new key generation goes through `api_keys` table only.

**Phase B — Migrate existing keys (Week 2):**
- Run a background job that iterates all `profiles` rows with a `connect_key`:
  - For each, check if an `api_keys` row already exists for this hash. If not, create one:
    - `key_hash` = SHA-256 of the existing connect_key.
    - `key_prefix` = first 12 chars.
    - `name` = "Migrated key".
    - `scope` = "agent".
    - `user_id` = the profile's user.
  - After inserting, do NOT delete `profiles.connect_key` yet (keep as backup).
- Log migration progress to a `migration_log` table.

**Phase C — Notify users to rotate keys (Week 3):**
- Send email to all users: "We've upgraded our API key security. Please generate a new API key from your dashboard and update your agents. Your old key will expire on [date + 30 days]."
- Dashboard shows a banner: "Your API key was migrated from the old format. Generate a new key for enhanced security."

**Phase D — Remove legacy fallback (Week 5, after 30-day notice):**
- Remove the `profiles.connect_key` fallback from `validateConnectKey()`.
- Set `profiles.connect_key` to NULL for all rows (keep the column for one more release as safety, then drop in a future migration).
- Any agent still using an old key now gets a 401. The dashboard banner has been showing for 30 days.

### Step 3: Brain Entry Backfill

Existing brain entries created before the Sarvam classification stage will have `sarvam_category = NULL`, `sarvam_risk_level = NULL`, etc.

- **Do NOT backfill all entries at once** — this would burn through Sarvam API credits.
- **Lazy backfill:** When a brain entry is retrieved by `get_context` or viewed in the dashboard, if `sarvam_category IS NULL`, trigger an async classification (fire-and-forget, non-blocking to the response).
- **Batch backfill option:** Dashboard Settings page gets a "Classify unclassified entries" button that runs a background job classifying entries in batches of 20 (with rate limiting). Shows progress: "Classifying 47 unclassified entries... 12/47 done."
- **New entries:** All new proposals go through the full 8-stage pipeline and are classified from the start.

### Step 4: Existing Proposals in Queue

Proposals that were submitted before the 8-stage pipeline deployment and are still in `pending` status:
- On next pipeline run (or manual trigger from dashboard), they go through the full 8-stage pipeline.
- If a proposal was already `auto_applied` or `gated` under the old 6-stage pipeline, it is NOT re-processed (it stays in its current state).
- Only `pending` proposals are processed through the new pipeline.

### Step 5: User Subscription Migration

- All existing users are assigned the `free` plan on their `user_subscriptions` row (created via trigger or background job).
- Their existing `profiles.credits` balance is preserved — it becomes their starting `credits_used_this_period = plan.credits_monthly - profiles.credits`.
- The `profiles.credits` column remains as the source of truth during transition. The `user_subscriptions.credits_used_this_period` is synced from `profiles.credits` via the `deduct_credit()` function (which updates both).
- Once stable, `profiles.credits` is deprecated (kept in sync but read-only).

### Step 6: Feature Rollout Gating

- Brain seeding, document intelligence, translation, cross-agent insights, and time-saved metrics are behind feature flags.
- **Free tier:** brain seeding (limited to 3 files), time-saved metric, brain export. No cross-agent insights, no document intelligence, no translation.
- **Pro tier:** all features, up to 500 brain entries, 3 agents.
- **Team tier:** all features, unlimited brain entries, 10 agents.
- Feature flags checked in `lib/billing/plans.ts` → `checkFeatureAccess(userId, feature)`.

---

## Verification Plan

### 1. Automated Tests (Vitest)

#### 1.1 Security Tests
- **`tests/middleware/sdk-gateway.test.ts`**:
  - Rejects requests with no Authorization header (401).
  - Rejects requests with `?key=` query param (401 — credentials must be in header).
  - Rejects requests with malformed Bearer token (401).
  - Accepts valid hashed API key, returns `AuthorizedContext`.
  - Rejects revoked API key (401).
  - Rejects expired API key (401).
  - Rate limits: 61st write request in a minute returns 429.
  - Rate limits: 121st read request in a minute returns 429.
  - `requireAgentId: true` — rejects when agent_id belongs to different user (403).
  - `requireProjectId: true` — rejects when project_id belongs to different user (403).
  - CORS: rejects requests from non-allowed origin.
  - Passes validated Zod body to handler (no `any`).
  - Step index 0 is accepted (not rejected as falsy).

- **`tests/sdk-auth.test.ts`**:
  - `validateConnectKey()` hashes key correctly (SHA-256).
  - Hashed key lookup in `api_keys` works.
  - Legacy fallback to `profiles.connect_key` works during transition.
  - `last_used_at` is updated (fire-and-forget, doesn't block response).
  - JWT token includes `kid` and `jti`.
  - JWT expires after 1 hour.
  - Throws if `AGENTHELM_JWT_SECRET` is not set (except in build).

- **`tests/security/cross-tenant.test.ts`** (integration test):
  - User A creates agent, User B tries to access User A's agent data → 403.
  - User A creates project, User B tries to inject context into User A's project → 403.
  - User A creates proposal, User B tries to view/approve it → 403.
  - User A's API key cannot access User B's brain entries → 403.
  - Service-role client is never used without user scoping in SDK routes.

#### 1.2 Sarvam Client Tests
- **`tests/providers/sarvam-client.test.ts`**:
  - Returns parsed JSON when Sarvam responds successfully.
  - Returns `null` on 5-second timeout (mock slow response).
  - Returns `null` on HTTP 4xx/5xx.
  - Returns `null` on invalid JSON response.
  - Returns `null` on network error.
  - Uses correct model (`sarvam-105b`).
  - Passes `reasoning_effort` correctly.
  - Passes `response_format: json_schema` correctly.

- **`tests/providers/sarvam-classify.test.ts`**:
  - Returns rich classification when Sarvam is available.
  - Falls back to deterministic classification when Sarvam returns `null`.
  - Fallback infers category from content fields.
  - Fallback sets risk to `"medium"`.

- **`tests/providers/sarvam-semantic.test.ts`**:
  - Returns `same` for semantically identical entries.
  - Returns `contradicts` for opposing entries.
  - Returns `different` for unrelated entries.
  - Falls back to Tier 1 bigram result when Sarvam is unavailable.

#### 1.3 Policy Engine Tests
- **`tests/policy-engine.test.ts`**:
  - `disabled` mode: all proposals allowed (but logged).
  - `shadow` mode: evaluates and logs, doesn't block.
  - `gated` mode: all proposals go to review.
  - `auto` mode: low-risk + high-evidence → auto-apply; high-risk → review.
  - Hardcoded backstop: prompt injection pattern → REJECT (even in disabled mode).
  - Hardcoded backstop: credential pattern → REJECT (even in disabled mode).
  - No rule matches → defaults to `review` (fail-safe).
  - Audit log entry created for every evaluation.

#### 1.4 Credit & Billing Tests
- **`tests/billing/credits.test.ts`**:
  - `deduct_credit()` atomically deducts from balance.
  - Concurrent `deduct_credit()` calls with same idempotency key → only one succeeds.
  - `deduct_credit()` returns false when insufficient balance.
  - `refund_credit()` adds credits back.
  - `checkUsageLimit()` returns true when under limit, false when over.
  - `recordUsage()` inserts event and increments counter.
  - Free plan: 51st brain entry proposal → blocked (max 50 entries).
  - Free plan: 101st Sarvam call in a day → blocked.

#### 1.5 Brain Seeding Tests
- **`tests/brain/brain-seeder.test.ts`**:
  - Parses README.md and extracts architecture entries.
  - Parses openapi.yaml and extracts API entries.
  - Parses schema.sql and extracts database entries.
  - Parses .cursorrules and extracts standards entries.
  - Handles missing files gracefully (skips, logs warning).
  - Creates proposals that go through the normal pipeline.
  - Returns correct `SeedingResult` counts.

#### 1.6 Document Intelligence Tests
- **`tests/sarvam/document-intelligence.test.ts`**:
  - Extracts text from PNG image (mock Sarvam Vision response).
  - Extracts knowledge entities from text content.
  - Handles PDF with multiple pages.
  - Falls back to regex extraction when Sarvam is unavailable.
  - Rejects unsupported file types.
  - Rejects files over size limit.

#### 1.7 Translation Tests
- **`tests/sarvam/translation.test.ts`**:
  - Detects Hindi text correctly.
  - Translates Hindi to English.
  - Stores both `original_text` and `translated_text`.
  - Skips translation when text is already English (no API call).
  - Falls back to original text when Sarvam Translation is down.

### 2. Integration Tests

- **`tests/integration/full-pipeline.test.ts`**:
  - Propose knowledge → intake → policy → classify → verify → validate → analyze → plan → build → brain published.
  - Verify brain version incremented.
  - Verify `get_context` now returns the new entry.
  - Verify staleness check ran on related entries.

- **`tests/integration/conflict-detection.test.ts`**:
  - Propose entry A. Propose entry B that contradicts A. Verify conflict detected, B goes to review.

- **`tests/integration/brain-seed-to-context.test.ts`**:
  - Seed brain from repo. Verify entries are created. Call `get_context` with relevant task hint. Verify seeded entries are returned.

- **`tests/integration/billing-flow.test.ts`**:
  - Create free user. Hit usage limits. Upgrade to pro. Verify limits lifted.

- **`tests/integration/export-import.test.ts`**:
  - Export brain to JSON. Import into new project. Verify entries match.

### 3. Manual Verification

1. **Build passes:**
   ```bash
   npm run build
   ```
   No type errors, no lint errors, no build warnings.

2. **API security manual test:**
   - Use User A's API key to call User B's agent endpoint → expect 403.
   - Call SDK route without Authorization header → expect 401.
   - Call SDK route with `?key=...` → expect 401.
   - Call SDK route 61 times in a minute → expect 429 on 61st call.

3. **Sarvam fallback manual test:**
   - Set `SARVAM_API_KEY` to invalid value.
   - Propose knowledge → pipeline should still complete (using deterministic fallbacks).
   - Verify `pipeline_result.stages.classify.fallback_used = true`.

4. **Frontend manual test:**
   - Landing page renders with warm paper palette, no gradient text, no centered hero.
   - Dashboard renders with same palette as landing page (unified).
   - All 7 dashboard pages load without errors.
   - Onboarding flow works end-to-end for a new user.
   - Pricing section shows correct tiers and prices in ₹.
   - Brain export downloads a JSON file.
   - Brain import uploads and creates entries.

5. **Cashfree payment flow:**
   - Subscribe to Pro plan → redirected to Cashfree → payment success → subscription active.
   - Verify `user_subscriptions` table updated.
   - Cancel subscription → status changes to `canceled` at period end.

6. **Migration dry-run:**
   - Run all migrations on a copy of production data.
   - Verify existing users can still log in, see their projects, and call SDK routes.
   - Verify `api_keys` table has migrated entries for all profiles with `connect_key`.
   - Verify RLS policies don't break existing dashboard queries.

### 4. Test Commands

```bash
# Run all tests
npm test -- --run

# Run only security tests
npm test -- --run tests/middleware tests/security tests/sdk-auth

# Run only Sarvam provider tests
npm test -- --run tests/providers

# Run integration tests (requires test database)
npm test -- --run tests/integration

# Build check
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Execution Order

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | Phase 1 (Security) | 1.1 Sarvam-105B migration, 1.2 SDK auth middleware (start), 1.3 API keys table + migration, 1.4 JWT secret |
| 2 | Phase 1 (Security) | 1.2 SDK auth middleware (finish all 22 routes), 1.5 RLS hardening, 1.6 Credit ledger |
| 2-3 | Phase 4 (Type Safety) | 4.1 Zod schemas (parallel with Phase 1) |
| 3 | Phase 2 (Brain Compiler) | 2.1 Classification, 2.2 Policy engine |
| 4 | Phase 2 (Brain Compiler) | 2.3 Semantic conflict, 2.4 Evidence quality, 2.5 Dependency mapping |
| 5 | Phase 2 (Brain Compiler) | 2.6 Context retrieval, 2.7 Staleness, 2.8 Pipeline redesign |
| 5 | Phase 6 (Sarvam) | 6.1 Document Intelligence, 6.2 Translation |
| 6 | Phase 5 (Retention + Business) | 5.1 Brain seeder, 5.5 Business logic (plans, billing, onboarding) |
| 7 | Phase 5 (Retention) | 5.2 Time-saved metric, 5.3 Cross-agent insights, 5.4 Brain export/import |
| 8 | Phase 3 (Frontend) | 3.1 Design system, 3.2 Landing page |
| 9 | Phase 3 (Frontend) | 3.3 Dashboard pages, component integration |
| 10 | Migration + Verification | Run migrations on staging, full test suite, manual verification, deploy |

---

## Rules

- Every Sarvam call must have a deterministic fallback (return null → caller falls back).
- Every Sarvam call must have a 5-second timeout (AbortController).
- Every SDK route must go through `withSdkAuth` middleware.
- Every database query in SDK routes must be scoped by `user_id` (defense-in-depth with RLS).
- Never accept credentials from URL query params.
- Never use wildcard CORS.
- The pipeline must never block an agent if Sarvam is down — it falls back to deterministic logic.
- The policy engine must default to `"review"` (fail-safe) when no rule matches.
- Forbidden patterns (prompt injection, credentials) must be hardcoded and cannot be overridden by project config.
- The brain is append-only: entries are deprecated/superseded, never deleted.
- Credits are deducted atomically via Postgres function — never read-then-write.
- API keys are shown once on creation — only the hash is stored.
- Free tier users can always use `get_context` (0 credits) — the brain must always be readable.
- Brain seeding proposals go through the same pipeline as agent proposals — no shortcut.
- Document Intelligence and Translation are pro/team features — free tier gets brain seeding but not file upload or translation.
- All migrations are forward-compatible (additive) — no destructive changes during transition.
- Legacy connect key fallback stays for 30 days after deployment, then is removed.
