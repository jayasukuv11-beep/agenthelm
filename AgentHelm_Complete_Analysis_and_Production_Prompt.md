# AgentHelm — Complete Product Analysis & Production-Readiness Prompt

## Table of Contents
1. [What Is AgentHelm](#what-is-agenthelm)
2. [How AgentHelm Works](#how-agenthelm-works)
3. [The Problems (Current State)](#the-problems)
4. [How to Solve Them](#how-to-solve-them)
5. [Cursor Prompt — Make It Production Ready](#cursor-prompt)

---

## What Is AgentHelm

AgentHelm is a **shared memory and governance control plane for autonomous AI agent fleets**. It gives AI coding agents (Claude Code, Cursor, Codex, custom Python/Node fleets) a shared, versioned "Project Brain" so they remember architecture decisions, API contracts, database schemas, and project conventions across sessions — instead of starting from zero every time.

### The Core Metaphor
Think of it as **git for agent memory**. Agents propose changes (new knowledge), a Brain Compiler validates them (like CI checks), a policy engine decides what's safe to auto-merge (like branch protection rules), and you review the rest. The brain is append-only, versioned, and never loses history.

### Why It Exists
Every agent session starts with amnesia. Claude Code doesn't know what Cursor decided last Tuesday. Your Python agent doesn't know the Postgres migration already happened. Your Codex agent re-derives the same API contract the previous agent already documented. Every session, every agent, every context window — starting from zero.

The fix isn't bigger context windows. The fix is a shared, durable, versioned knowledge store that every agent reads from and writes to — with rules about what goes in automatically and what waits for a human.

### Who Uses It
- **Agents** — connect via SDK (Python/Node) or MCP server, query the brain on startup, propose knowledge as they work
- **Developers** — manage the brain via dashboard, review gated proposals, configure policy
- **Reviewers** — approve/reject proposals via dashboard or Telegram

---

## How AgentHelm Works

### The Project Brain Loop

```
1. Agent starts task
2. get_context(task_hint="auth migration")     ← always automatic (read)
3. Agent reasons + uses tools
4. propose_knowledge(summary="Add rate limiting")  ← governed by policy (write)
5. Brain Compiler validates + compiles
6. Policy decides: auto-apply or gate
7. If auto-applied → brain version published → next get_context includes it
8. If gated → developer reviews on dashboard/Telegram → approve → brain published
```

### The Brain Compiler Pipeline (6 stages → redesigned to 8)

**Current pipeline (6 stages):**

| Stage | What it does | How |
|-------|-------------|-----|
| 1. Intake | Load proposal, Sarvam classify (PROMOTE/IGNORE), validate structure | `sarvam-promotion.ts` calls Sarvam-30B (deprecated) with binary classification |
| 2. Verify | Evidence scoring | Binary weights: git=+30, tests=+20, human=+40, branch=+10, no-files=-20 |
| 3. Validate | Structure validation | `proposal-validator.ts` checks fields, sizes, file paths |
| 4. Analyze | Conflict detection | Character-bigram Jaccard similarity (can't detect semantic relationships) |
| 5. Plan | Merge plan | `merge-plan.ts` decides: add/supersede/reject, merge/review |
| 6. Build | Publish | `brain-publisher.ts` creates new brain version, deprecates old entries, fires staleness check |

**Redesigned pipeline (8 stages):**

| Stage | What it does | AI vs Deterministic |
|-------|-------------|-------------------|
| 1. Intake | Load proposal, validate structure | Deterministic |
| 2. Policy (NEW) | Evaluate rules: auto-apply / gate / reject | Deterministic |
| 3. Classify (NEW) | Rich classification: category, risk, confidence, summary | Sarvam-105B |
| 4. Verify | Evidence scoring + qualitative quality assessment | Deterministic + Sarvam-105B |
| 5. Validate | Structure validation | Deterministic |
| 6. Analyze | Semantic conflict detection, dependency mapping | Deterministic pre-filter + Sarvam-105B |
| 7. Plan | Merge plan using all intelligence | Deterministic |
| 8. Build | Publish + enhanced staleness check | Deterministic + Sarvam-105B |

### Integration Points

| Integration | How |
|-------------|-----|
| **Python SDK** | `pip install agenthelm-sdk` — Agent class with get_context, propose_knowledge, checkpoint, etc. |
| **Node SDK** | `npm install agenthelm-node-sdk` — same interface |
| **MCP Server** | `npm install agenthelm-mcp` — plugs into Cursor, Claude Code, Claude Desktop. Exposes 7 tools: get_context, propose_knowledge, get_history, resume_task, list_tasks, record_incident, get_incident |
| **Dashboard** | Next.js app at agenthelm.online — brain health, proposals, versions, policy, agents |
| **Telegram** | HITL approval notifications — approve/reject from mobile |
| **Sarvam-105B** | Powers classification, conflict detection, evidence assessment, staleness, context re-ranking |

### Tech Stack
- **Frontend**: Next.js 14 + React 19 + Tailwind + shadcn/ui
- **Backend**: Next.js API routes (modular monolith)
- **Database**: Supabase (Postgres 15) with Row-Level Security
- **Cache/Queue**: Upstash Redis (rate limiting, distributed locks)
- **AI/LLM**: Sarvam-105B (structured outputs, hybrid reasoning, 128K context)
- **Payments**: Cashfree (Indian payment gateway)
- **Notifications**: Telegram Bot API + Resend (email)
- **Observability**: Sentry + internal pipeline metrics

---

## The Problems

### Problem 1: Deprecated Sarvam Model (P0)

**What:** `lib/brain/providers/sarvam-promotion.ts` calls `model: "sarvam-30b"` which has been deprecated by Sarvam AI. The docs say: "Sarvam-30B has been deprecated — migrate to Sarvam-105B."

**Impact:** The model will stop working at any time. When it does, the Brain Compiler's intake stage fails on every proposal — the entire pipeline breaks.

**Additionally:** The code passes `reasoning_effort: null` (reasoning disabled) and manually parses JSON by stripping markdown blocks with try/catch — fragile and unnecessary since Sarvam-105B supports `response_format: json_schema` for guaranteed valid JSON.

---

### Problem 2: 22 Vulnerable SDK Routes — Cross-Tenant Access (P0)

**What:** 22 out of 25 routes under `/api/sdk/*` call `validateConnectKey()` to authenticate the user, but never verify that the `agent_id` / `task_id` / `project_id` in the request body belongs to that user. They then use the Supabase service-role client (which bypasses RLS) to read/write data.

**Impact:** A customer with any valid connect key can read or mutate another customer's agent data, memory, traces, checkpoints, proposals, and timeline events by simply guessing or discovering an ID. This is a critical security vulnerability that prevents any serious customer from using the product.

**The 13 vulnerable write routes (most dangerous):**
`log`, `memory`, `output`, `state`, `checkpoint`, `tasks`, `tasks/claim`, `tasks/complete`, `presence/claim`, `interventions`, `execution`, `traces`, `timeline/batch`

**The 9 vulnerable read routes (data leakage):**
`inject`, `proposals`, `injection`, `replay`, `contracts`, `evals/from-trace`, `evals/judge`, `evals/regression`, `evals/results`

**3 routes already fixed:** `handoffs`, `command`, `reasoning` — these use `authorizeSdkAgent()` correctly.

---

### Problem 3: Plaintext Connect Keys (P0)

**What:** `profiles.connect_key` stores API keys in plaintext. Keys are long-lived, have no expiry, no scope, no rotation mechanism, and no revocation state. Anyone who sees a key (in a log, screenshot, or git commit) has permanent access.

**Impact:** Key leakage = permanent account compromise with no remediation path except manually changing the key in the database.

---

### Problem 4: Service-Role Key Used as JWT Signing Secret (P1)

**What:** `lib/sdk-auth.ts` line 3: `const secretSource = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY` — falls back to the Supabase service-role key as the JWT signing secret.

**Impact:** If the service-role key leaks, an attacker can forge agent tokens and impersonate any agent.

---

### Problem 5: Credentials in URL Query Params (P1)

**What:** `command/route.ts` GET and `handoffs/route.ts` GET accept `?key=` in query parameters.

**Impact:** Query strings are captured by access logs, proxies, browser history, and monitoring tools — credential exposure risk.

---

### Problem 6: Wildcard CORS (P1)

**What:** Multiple SDK routes return `Access-Control-Allow-Origin: "*"`.

**Impact:** Any website can make authenticated requests to the SDK API if the user's browser has the key cached.

---

### Problem 7: Supabase RLS Policies Are Permissive (P1)

**What:** `agent_handoffs` and `subscriptions` tables have `USING (true) WITH CHECK (true)` policies — meaning anyone can read/write. SECURITY DEFINER functions (`handle_new_user`, `rls_auto_enable`) are executable by anon and authenticated roles. Four functions have mutable `search_path`.

**Impact:** RLS is effectively disabled on these tables — no multi-tenant isolation.

---

### Problem 8: Race Condition in Credit Deductions (P1)

**What:** `log/route.ts` reads the user's credit balance, calculates the new balance, and writes it back. Two concurrent log calls can both read the same balance and one overwrites the other.

**Impact:** Users can be overcharged or undercharged. A malicious user could race concurrent requests to drain credits.

---

### Problem 9: Sarvam Is Massively Underutilized (P2)

**What:** Sarvam-105B supports structured outputs (`response_format: json_schema`), hybrid thinking mode (`reasoning_effort: low/medium/high`), tool calling, 128K token context, and wiki grounding. The current codebase uses Sarvam for a single binary classification (PROMOTE/IGNORE) with reasoning disabled and manual JSON parsing.

**Impact:** The Brain Compiler has no semantic understanding of proposals. It can't tell that "JWT tokens" and "bearer tokens" are the same concept. It can't assess evidence quality. It can't detect cross-category dependencies. It can't rank context by semantic relevance.

---

### Problem 10: Conflict Detection Uses Character Bigrams (P2)

**What:** `lib/brain/knowledge-analyzer.ts` uses Jaccard similarity on character bigrams to detect conflicts, duplicates, and similar entries.

**Impact:** `{"table": "users", "action": "add_column", "column": "email"}` and `{"table": "user_settings", "action": "add_column", "column": "email_verified"}` have high similarity (~0.6) because they share many character bigrams, even though they describe different database operations. Conversely, "JWT tokens" and "bearer tokens" have low similarity despite being the same concept.

---

### Problem 11: Dependency Detection Is Keyword-Based (P2)

**What:** `detectDependencies()` uses `String.includes(keyword)` to find related entries.

**Impact:** An API change to `/api/v2/users` won't link to the `profiles` table entry because "users" doesn't appear in "profiles". Cross-category dependencies are completely missed.

---

### Problem 12: Staleness Analyzer Misuses Promote/Ignore Classifier (P2)

**What:** `lib/brain/staleness-analyzer.ts` calls `classifyObservation()` (designed for PROMOTE/IGNORE proposal classification) with "Does the new change invalidate this knowledge?" — a semantic mismatch. The function returns `{ promote: boolean }` which doesn't map to staleness.

**Impact:** Staleness detection is unreliable. The function isn't designed for the question being asked.

---

### Problem 13: Context Retrieval Uses Token Substring Matching (P2)

**What:** `app/api/sdk/inject/route.ts` uses `String.includes(token)` for scoring entry relevance to a task hint.

**Impact:** Asking for context about "authentication" won't find entries titled "Login flow" or "Session management" because those exact words don't match.

---

### Problem 14: No Policy Engine (P2)

**What:** There's no configurable per-project policy for what's safe to auto-apply vs. what needs human review. Every proposal either auto-merges (if evidence score > 50 and no conflicts) or goes to review. No nuance, no per-category rules, no forbidden patterns.

**Impact:** Developers can't let agents run autonomously without babysitting every proposal. No way to say "notes are auto-applied but database changes always need my review."

---

### Problem 15: Frontend Looks AI-Generated (P2)

**What:** The landing page uses centered hero with gradient text, card grids for every section, `font-mono uppercase tracking-tight` on every heading, grid background overlay — the default LLM output pattern. The dashboard uses a cold dark zinc/indigo palette inconsistent with any editorial design.

**Impact:** Developers dismiss the product as another AI wrapper before reading the content. The dashboard uses different colors from the landing page — inconsistent design system.

---

### Problem 16: Missing Dashboard Pages (P2)

**What:** 6 planned dashboard pages don't exist as routes (Project Brain, Knowledge, Pipeline, Versions, Security, Observability). 2 fully-built brain components (`ProjectBrainPanel`, `KnowledgeProposalsPanel`) are orphaned — not imported anywhere.

**Impact:** The dashboard is incomplete. Users can't browse knowledge entries, view version history, or manage policies.

---

### Problem 17: `any` Casts Everywhere (P2)

**What:** SDK routes use `await req.json()` and cast to `any`, then access fields without validation. No Zod schemas, no type safety on request bodies.

**Impact:** Runtime errors on malformed input. Impossible to type-check the codebase. No request validation.

---

### Problem 18: Step Index Validation Bug (P2)

**What:** Some routes use `if (!step_index)` to validate, which rejects the valid zero-based step index `0`.

**Impact:** Reasoning steps with `step_index: 0` are silently rejected.

---

## How to Solve Them

### Solution 1: Migrate Sarvam-30B → Sarvam-105B
- Change model to `sarvam-105b`
- Enable `reasoning_effort: "low"` (or "medium" for classification)
- Add `response_format: { type: "json_schema", json_schema: {...} }` for guaranteed valid JSON
- Remove manual markdown stripping and try/catch JSON parsing
- Create shared `lib/brain/providers/sarvam-client.ts` with 5s timeout + deterministic fallback

### Solution 2: Create `withSdkAuth()` Middleware
- Create `lib/middleware/sdk-gateway.ts` that every SDK route passes through
- Extract key from `Authorization: Bearer` header only (never URL params)
- Hash key (SHA-256), look up in `api_keys` table, check expiry/revocation
- Rate limit via Upstash Redis (60/min writes, 120/min reads)
- Validate request body with Zod schema
- If `requireAgentId`: verify agent belongs to user via `authorizeSdkAgent()`
- If `requireProjectId`: verify project belongs to user
- Wrap all 22 vulnerable routes with this middleware

### Solution 3: Hashed API Keys
- New `api_keys` table with `key_hash`, `key_prefix`, `scope`, `agent_id`, `project_id`, `expires_at`, `last_used_at`, `revoked_at`
- Update `validateConnectKey()` to hash incoming key and look up in `api_keys`
- Build key management UI (create, view-once, revoke, track last-used)

### Solution 4: Dedicated JWT Secret
- Add `AGENTHELM_JWT_SECRET` env var (256-bit, high-entropy)
- Remove fallback to `SUPABASE_SERVICE_ROLE_KEY`
- Add `kid` (key ID) header for rotation, `jti` (token ID) for revocation
- Reduce TTL from 12h to 1h

### Solution 5: Remove URL Credentials + Fix CORS
- Accept `Authorization: Bearer` header only — remove `?key=` query param handling
- Remove `Access-Control-Allow-Origin: "*"` from all routes
- Explicitly allow only `agenthelm.online` origins

### Solution 6: Fix RLS Policies
- Drop `USING (true) WITH CHECK (true)` policies
- Revoke `EXECUTE` on SECURITY DEFINER functions from `PUBLIC, anon, authenticated`
- Set safe `search_path` on all privileged functions
- Enable leaked-password protection in Supabase Auth

### Solution 7: Atomic Credit Deductions
- Create `credit_ledger` table (append-only) with `idempotency_key UNIQUE` constraint
- Create `deduct_credit()` Postgres function (SECURITY DEFINER) that inserts ledger row + updates balance atomically
- Replace read-then-write pattern in `log/route.ts` with single RPC call

### Solution 8: Rich Sarvam Classification
- New `sarvam-classify.ts` returning category, risk_level, action, confidence, summary_for_brain, semantic_tags
- Add as pipeline stage 3 (between intake and verify)
- Store results on `knowledge_proposals` table
- Fallback: infer category from content, set risk to "medium"

### Solution 9: Semantic Conflict Detection
- New `sarvam-semantic.ts` with `analyzeSemanticRelation()` returning same/related/different/contradicts
- Two-tier: deterministic bigram pre-filter (fast) → Sarvam for ambiguous cases (0.3-0.85 similarity)
- Fallback: Tier 1 only (current behavior)

### Solution 10: Evidence Quality Assessment
- New `sarvam-evidence.ts` assessing evidence qualitatively (strong/moderate/weak/irrelevant)
- Returns quality_score (0-100), missing_evidence, risk_factors
- Called in verify stage after deterministic scoring
- Fallback: use deterministic score

### Solution 11: Intelligent Dependency Mapping
- New `sarvam-dependencies.ts` doing batch Sarvam call (up to 50 entries in context)
- Replaces keyword-based `detectDependencies()`
- Fallback: no dependencies detected

### Solution 12: Semantic Context Retrieval
- New `sarvam-context.ts` re-ranking top 20 entries by semantic relevance
- Two-tier: deterministic token scoring → Sarvam re-rank top 20
- Fallback: deterministic scoring only

### Solution 13: Dedicated Staleness Function
- New `sarvam-staleness.ts` returning is_stale, confidence, suggested_action
- Replaces misuse of `classifyObservation()` in staleness analyzer
- Fallback: assume stale, mark NEEDS_REVIEW

### Solution 14: Policy Engine
- New `project_policies` table with mode (gated/auto/shadow/disabled) and 3 rule layers
- New `policy-engine.ts` with `evaluatePolicy()` function
- Add as pipeline stage 2 (between intake and classify)
- New `policy_audit_log` table (append-only)
- Hardcoded backstop: prompt injection, credentials, policy modification always rejected

### Solution 15: Unified Design System
- Warm paper palette (#F4F1EA, #1A1916, #DC4A2A, Sarvam purple #6B2FA0)
- Three fonts: Space Grotesk (display), Inter (body), JetBrains Mono (code)
- Apply across landing page AND dashboard (same CSS variables)

### Solution 16: Rebuild Frontend
- Landing: asymmetric hero, editorial prose, real terminal, policy table, Sarvam partnership section
- Dashboard: 7 pages (overview, proposals, knowledge, versions, policy, agent detail, settings)
- Integrate orphaned components, delete unused ones

### Solution 17: Zod Schemas
- New `lib/schemas/sdk-schemas.ts` with Zod schema per route
- Pass to `withSdkAuth()` middleware for automatic validation
- Remove all `any` casts

### Solution 18: Fix Step Index Validation
- Replace `if (!step_index)` with `if (!Number.isInteger(step_index) || step_index < 0)`

---

## Cursor Prompt — Make It Production Ready

```
You are working on AgentHelm — a shared memory and governance control plane for AI agent fleets. The codebase is a Next.js 14 app with Supabase, Upstash Redis, and Sarvam AI integration.

The product has 18 identified problems ranging from P0 security vulnerabilities to P2 frontend issues. Here is the complete prompt to fix them in priority order.

## CONTEXT

AgentHelm gives AI coding agents (Claude Code, Cursor, Codex) a shared, versioned "Project Brain." Agents query it on startup (get_context) and propose knowledge as they work (propose_knowledge). A Brain Compiler pipeline validates proposals, detects conflicts, and publishes new brain versions. The product needs to be made production-ready for paying customers.

Tech stack: Next.js 14, React 19, Supabase (Postgres + RLS), Upstash Redis, Sarvam-105B API, Cashfree payments, Telegram Bot API, Tailwind, shadcn/ui.

## PHASE 1: SECURITY (Do This First — Nothing Else Matters If This Is Broken)

### 1.1 Migrate Sarvam-30B to Sarvam-105B
File: lib/brain/providers/sarvam-promotion.ts
- Change model from "sarvam-30b" to "sarvam-105b" (sarvam-30b is deprecated)
- Change reasoning_effort from null to "low"
- Add response_format with json_schema for guaranteed valid JSON output
- Remove the manual markdown stripping (content.replace(/```json/g, "")) and try/catch JSON.parse
- Create a shared client at lib/brain/providers/sarvam-client.ts with:
  - 5-second AbortController timeout
  - Deterministic fallback (return null on any failure)
  - Shared fetch logic for all Sarvam calls
- Every Sarvam function must return null on failure, and callers must check for null and fall back to deterministic logic

### 1.2 Create SDK Auth Middleware
Create: lib/middleware/sdk-gateway.ts
This middleware wraps every /api/sdk/* route. It:
1. Extracts key from Authorization: Bearer header (NEVER from URL query params)
2. Hashes key with SHA-256, looks up in api_keys table (see 1.3)
3. Checks expiry (expires_at) and revocation (revoked_at IS NULL)
4. Updates last_used_at (fire-and-forget, don't block on it)
5. Rate limits via Upstash Redis: 60/min for writes, 120/min for reads
6. Validates request body with Zod schema (see Phase 4)
7. If requireAgentId option is set: calls authorizeSdkAgent(key, agent_id) to verify the agent belongs to this user
8. If requireProjectId option is set: verifies project ownership (project.user_id === auth.userId)
9. Passes AuthorizedContext { userId, agentId, projectId, plan, supabase } to the handler

Then wrap all 22 vulnerable SDK routes. For each route:
- Replace `validateConnectKey(key)` with the middleware
- Add `requireAgentId: true` for routes that accept agent_id
- Add `requireProjectId: true` for routes that accept project/project_id
- Add appropriate Zod schema
- Remove all `any` casts, use typed body from middleware
- Remove `?key=` query param handling — accept Authorization header only
- Remove `Access-Control-Allow-Origin: "*"` — restrict to agenthelm.online origins
- Remove OPTIONS handlers that return wildcard CORS

The 22 routes to fix:
Write routes (requireAgentId): log, memory, output, state, checkpoint, tasks, tasks/claim, tasks/complete, presence/claim, interventions, execution, traces, timeline/batch
Read routes (requireAgentId or requireProjectId): inject, proposals, injection, replay, contracts, evals/from-trace, evals/judge, evals/regression, evals/results

### 1.3 Replace Plaintext Connect Keys with Hashed API Keys
Create migration: supabase/migrations/043_api_keys.sql
- Create api_keys table: id, user_id, key_prefix (first 12 chars for display), key_hash (SHA-256, UNIQUE), name, scope (agent/admin/readonly), agent_id (nullable FK), project_id (nullable FK), expires_at (nullable), last_used_at, revoked_at, created_at
- Enable RLS: policy "users_own_api_keys" USING (user_id = auth.uid())
- Index on key_hash WHERE revoked_at IS NULL

Update lib/sdk-auth.ts validateConnectKey():
- Hash incoming key with crypto.createHash('sha256').update(key).digest('hex')
- Look up in api_keys WHERE key_hash = hash AND revoked_at IS NULL
- Check expires_at if not null
- Update last_used_at (fire-and-forget)
- Return { userId, plan, agentId, projectId, supabase }

### 1.4 Dedicated JWT Signing Secret
File: lib/sdk-auth.ts
- Replace `process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY` with `process.env.AGENTHELM_JWT_SECRET` (required, 256-bit)
- Throw if AGENTHELM_JWT_SECRET is not set (except during build phase)
- Add kid (key ID) header for key rotation
- Add jti (crypto.randomUUID()) claim for token revocation tracking
- Reduce TTL from 12h to 1h in setExpirationTime
- Update .env.example to document AGENTHELM_JWT_SECRET

### 1.5 Fix Supabase RLS
Create migration: supabase/migrations/044_rls_hardening.sql
- DROP POLICY IF EXISTS on agent_handoffs that uses USING (true)
- DROP POLICY IF EXISTS on subscriptions that uses USING (true)
- REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated
- REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC, anon, authenticated
- ALTER FUNCTION update_updated_at_column() SET search_path = safe
- ALTER FUNCTION bump_brain_version() SET search_path = safe
- ALTER FUNCTION generate_connect_key() SET search_path = safe
- ALTER FUNCTION handle_new_user() SET search_path = safe

### 1.6 Atomic Credit Deductions
Create migration: supabase/migrations/045_credit_ledger.sql
- Create credit_ledger table: id, user_id, amount (integer, negative=debit), reason, idempotency_key (UNIQUE), related_agent_id, related_project_id, created_at
- Enable RLS
- Create deduct_credit() function (SECURITY DEFINER, LANGUAGE plpgsql):
  - INSERT into credit_ledger with ON CONFLICT (idempotency_key) DO NOTHING
  - UPDATE profiles SET credits = credits - amount WHERE id = user_id AND credits >= amount
  - RETURN FOUND (true if deduction succeeded, false if insufficient balance)

Update app/api/sdk/log/route.ts:
- Replace the read-balance-then-write-balance pattern with a single RPC call to deduct_credit()
- Pass idempotency_key (derive from content hash or request ID)

## PHASE 2: BRAIN COMPILER & SARVAM INTELLIGENCE

### 2.1 Rich Proposal Classification (New Pipeline Stage 3)
Create: lib/brain/providers/sarvam-classify.ts
- Function: classifyProposal(proposal) → SarvamClassification
- Returns: { category, risk_level, action, confidence (0-1), reason, related_categories[], summary_for_brain, semantic_tags[] }
- Sarvam call: model="sarvam-105b", reasoning_effort="medium", response_format=json_schema
- Fallback: infer category from content (db_changes→database, apis_affected→api, etc.), risk="medium"

Create migration: add columns to knowledge_proposals:
- sarvam_category TEXT, sarvam_risk_level TEXT, sarvam_confidence REAL, sarvam_summary TEXT, semantic_tags TEXT[]

Update lib/brain/pipeline.ts:
- Add "classify" to StageName type (between "intake" and "verify")
- Add doClassify() method that calls sarvam-classify.ts
- Store results on the proposal record

### 2.2 Policy Engine (New Pipeline Stage 2)
Create: lib/brain/policy-engine.ts
- Function: evaluatePolicy(proposal, config, evidenceScore) → PolicyResult
- PolicyResult: { decision: "allow"|"review"|"reject"|"shadow", rules_matched[], reason, mode, elapsed_ms }
- Decision flow:
  1. Hardcoded backstop: forbidden patterns (prompt injection regex, credential regex) → REJECT
  2. Reject rules match? → REJECT
  3. Mode is "disabled"? → ALLOW (still logs)
  4. Mode is "shadow"? → evaluate, log, don't block
  5. Mode is "gated"? → REVIEW
  6. Gate rules match? → REVIEW
  7. Auto-apply rules match AND evidence >= threshold? → ALLOW
  8. Default → REVIEW (fail-safe)

Create migration: supabase/migrations/046_policy_engine.sql
- project_policies table: project_id (UNIQUE FK), mode, auto_apply_rules JSONB, gate_rules JSONB, reject_rules JSONB, thresholds
- policy_audit_log table: project_id FK, proposal_id FK, agent_id, decision, rules_matched JSONB, mode, evidence_score, elapsed_ms, created_at

Update lib/brain/pipeline.ts:
- Add "policy" to StageName type (between "intake" and "classify")
- Add doPolicy() method that loads project policy and evaluates
- If decision is "reject", stop pipeline and mark proposal rejected

### 2.3 Semantic Conflict Detection
Create: lib/brain/providers/sarvam-semantic.ts
- Function: analyzeSemanticRelation(proposedEntry, existingEntry) → SemanticRelation
- Returns: { relation: "same"|"related"|"different"|"contradicts", confidence, reason, merge_strategy }
- Sarvam call: reasoning_effort="low" (runs per pair, needs speed)

Update lib/brain/knowledge-analyzer.ts:
- Make detectConflicts() async
- Keep bigram pre-filter as Tier 1 (fast, catches sim >= 0.95 and sim >= 0.85)
- For ambiguous zone (sim 0.3-0.85): call Sarvam analyzeSemanticRelation() as Tier 2
- Fallback: Tier 1 only

### 2.4 Evidence Quality Assessment
Create: lib/brain/providers/sarvam-evidence.ts
- Function: assessEvidenceQuality(proposal, baseScore) → EvidenceAssessment
- Returns: { evidence_quality, quality_score (0-100), reasoning, missing_evidence[], risk_factors[] }
- Sarvam call: reasoning_effort="medium"

Update lib/brain/pipeline.ts doVerify():
- After deterministic scoring, call Sarvam assessment
- Use quality_score instead of binary score
- Pass risk_factors to merge plan builder

### 2.5 Intelligent Dependency Mapping
Create: lib/brain/providers/sarvam-dependencies.ts
- Function: analyzeDependencies(newEntry, existingEntries[50]) → DependencyAnalysis
- Batch call: up to 50 entries in a single Sarvam call
- Returns: { dependencies: [{ entry_id, relationship, impact, should_mark_stale }] }

Update lib/brain/knowledge-analyzer.ts:
- Replace detectDependencies() with Sarvam-powered version
- Fallback: no dependencies detected

### 2.6 Semantic Context Retrieval
Create: lib/brain/providers/sarvam-context.ts
- Function: semanticReRank(taskHint, entries[20]) → RelevanceResult[]
- Sarvam call: reasoning_effort="low" (runs on every get_context)

Update app/api/sdk/inject/route.ts:
- After deterministic token scoring, get top 50 candidates
- Call Sarvam re-rank on top 20
- Blend: 70% semantic score + 30% deterministic score
- Fallback: deterministic scoring only

### 2.7 Dedicated Staleness Function
Create: lib/brain/providers/sarvam-staleness.ts
- Function: analyzeStaleness(newEntry, existingEntry) → StalenessResult
- Returns: { is_stale, confidence, reason, suggested_action }
- Sarvam call: reasoning_effort="low"

Update lib/brain/staleness-analyzer.ts:
- Replace classifyObservation() call with analyzeStaleness()
- Fallback: assume stale, mark NEEDS_REVIEW

### 2.8 Pipeline Stage Updates
Update lib/brain/pipeline.ts:
- StageName: "intake" | "policy" | "classify" | "verify" | "validate" | "analyze" | "plan" | "build"
- compile() flow: intake → policy → classify → verify → validate → analyze → plan → build
- Each stage records: ok, skipped, sarvam_used, fallback_used, elapsedMs
- PipelineResult includes per-stage Sarvam usage tracking

## PHASE 3: FRONTEND

### 3.1 Apply Unified Design System
Update app/globals.css:
- Replace dark zinc/indigo CSS variables with warm paper palette:
  --paper: #F4F1EA; --paper-dim: #EBE7DD; --paper-card: #FFFFFF;
  --ink: #1A1916; --ink-soft: #3D3A33; --muted: #8B877C;
  --line: #D5D0C4; --line-soft: #E2DED3;
  --vermilion: #DC4A2A; --vermilion-dark: #B83B1F; --vermilion-soft: #F9E8E2;
  --moss: #4A6B3A; --moss-soft: #E8EFE2;
  --amber: #B8862A; --amber-soft: #F5EDDA;
  --sarvam: #6B2FA0; --sarvam-soft: #F0EAF5;

Update tailwind.config.ts with matching color tokens.
Update app/layout.tsx: import Space Grotesk font alongside Inter and JetBrains Mono.

### 3.2 Rebuild Landing Page
Rewrite app/page-client.tsx and components/landing/*:
- Hero: 7/5 asymmetric grid (left: headline+CTA+Sarvam badge, right: terminal panel)
- NO gradient text (use italic + color for emphasis)
- NO centered layout
- NO card grid for every section
- Manifesto section: editorial prose with pull quote
- Pipeline section: dark background, 8 horizontal stages, AI stages tinted purple
- Sarvam partnership section: purple gradient panel with model specs
- Policy section: real HTML table with colored action badges
- SDK section: two code blocks side by side
- Footer: signed by founder, "Powered by Sarvam AI"
- Sarvam branding: nav badge, hero badge, terminal tag, pipeline attribution, partnership section, footer

### 3.3 Rebuild Dashboard
Rewrite app/(dashboard)/layout.tsx: warm paper sidebar with Sarvam pill, grouped nav
Build pages:
1. Overview: 4 health cards + activity feed + pipeline status + Sarvam intelligence panel + knowledge breakdown + policy mode
2. Proposals: full-width proposal cards with risk tags, Sarvam confidence, contextual actions
3. Knowledge: table (not cards) with validity pills, evidence scores, category filters
4. Versions: vertical timeline (like git log), expandable diffs
5. Policy: mode selector + 3 rule columns + rule editor + test panel
6. Agent Detail: tabs (Reasoning/Traces/Knowledge/Settings), reasoning timeline
7. Settings: profile, API key management, integrations, billing
Integrate orphaned: ProjectBrainPanel, KnowledgeProposalsPanel
Delete unused: AITimelinePanel, AgentPresenceGrid

## PHASE 4: TYPE SAFETY

### 4.1 Zod Schemas for All SDK Routes
Create: lib/schemas/sdk-schemas.ts
- One Zod schema per SDK route request body
- proposalSchema, contextSchema, checkpointSchema, handoffSchema, reasoningSchema, etc.
- Pass each schema to withSdkAuth() as the `schema` option
- Remove all `any` casts in SDK routes — use typed body from middleware
- Fix step_index validation: replace `if (!step_index)` with `if (!Number.isInteger(step_index) || step_index < 0)`

## EXECUTION ORDER

Phase 1 (Weeks 1-2): 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
Phase 2 (Weeks 3-5): 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8
Phase 3 (Weeks 6-8): 3.1 → 3.2 → 3.3
Phase 4 (Week 2-3, parallel): 4.1

## RULES
- Every Sarvam call must have a deterministic fallback (return null → caller falls back)
- Every Sarvam call must have a 5-second timeout (AbortController)
- Every SDK route must go through withSdkAuth middleware
- Every database query in SDK routes must be scoped by user_id (defense-in-depth with RLS)
- Never accept credentials from URL query params
- Never use wildcard CORS
- The pipeline must never block an agent if Sarvam is down — it falls back to deterministic logic
- The policy engine must default to "review" (fail-safe) when no rule matches
- Forbidden patterns (prompt injection, credentials) must be hardcoded and cannot be overridden by project config
- The brain is append-only: entries are deprecated/superseded, never deleted
```
