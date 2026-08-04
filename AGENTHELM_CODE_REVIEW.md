# AgentHelm code and architecture review

Review date: 2026-08-03  
Scope: Next.js application, Node/Python SDKs, Supabase production schema and advisors.

## Executive assessment

AgentHelm has a compelling and unusually complete product surface for an early agent-control plane: an operator dashboard, telemetry, task lifecycle, human approvals, agent memory/brain, project knowledge, evaluations, billing, Telegram control, and SDKs in Node and Python. The product direction is strong.

The current implementation should **not yet be treated as production-safe for untrusted multi-tenant customers**. The urgent issue is authorization: several SDK routes authenticate a connect key but then use the service-role client without confirming that every supplied agent, task, command, or handoff belongs to that key's user. A customer with any valid connect key could access or mutate another customer's records if they know or discover an ID.

## Release blockers

### P0 — cross-tenant access in handoffs

`app/api/sdk/handoffs/route.ts` validates a connect key but, for a normal (non-JWT) key, never verifies that `agent_id` belongs to `authResult.userId`. It then uses the service-role client.

- **POST** permits a valid key holder to create a handoff from any `agent_id`, to any `to_agent_id`, and with any `task_id`.
- **GET** permits reading handoffs for any supplied `agent_id`.

Fix: resolve both agent IDs through a single authorization helper before every query. Require that the source agent belongs to the authenticated user, the target agent belongs to the same project/workspace (or an explicitly authorized recipient), and the task belongs to that source agent/project. Do not query or write with an unscoped service-role client.

### P0 — cross-tenant telemetry forgery

`app/api/sdk/reasoning/route.ts` has the same pattern. A raw connect key is accepted and an arbitrary `agent_id` and `task_id` are inserted through the service role. This lets one customer inject reasoning records into another customer's timeline, corrupt evaluations, and potentially expose their operational metadata.

Fix: use the same centralized `authorizeSdkAgent()` helper and verify task ownership as well. Apply it consistently to **every** `/api/sdk/*` route; review by route, not by pattern matching.

### P0 — command acknowledgement is not bound to an agent

`app/api/sdk/command/route.ts` PATCH updates a command by `command_id` only. It validates a key but does not confirm that the command belongs to the authenticated agent/user. A valid key holder could acknowledge another agent's command if they know its ID.

Fix: fetch/update with a predicate that joins (or first checks) `agent_commands.agent_id` against the authorized agent ID and user. Prefer a single transactional RPC for command lease/acknowledgement to prevent competing agents from claiming the same command.

### P0 — Supabase policies and exposed privileged functions

The live Supabase security advisor reports:

- `agent_handoffs` and `subscriptions` each have an `ALL ... USING (true) WITH CHECK (true)` policy.
- `public.handle_new_user()` and `public.rls_auto_enable()` are SECURITY DEFINER functions executable by both anon and authenticated roles.
- Four public functions have a mutable `search_path`: `update_updated_at_column`, `bump_brain_version`, `generate_connect_key`, and `handle_new_user`.
- Leaked-password protection is disabled.

Fix: remove the permissive policies entirely; the service role bypasses RLS and does not need them. Move privileged functions to a private schema when possible, revoke `EXECUTE` from `PUBLIC`, `anon`, and `authenticated`, and set an explicit safe `search_path` in each privileged function. Enable leaked-password protection in Supabase Auth.

## High-priority correctness and security work

1. **Replace plaintext, account-wide connect keys.** `profiles.connect_key` is plaintext, long-lived, has no explicit expiry, scope, rotation, last-used time, or revocation state. Create an `agent_api_keys` table with a hashed secret, key prefix, agent/workspace scope, expiry, last-used timestamp, and revoked timestamp. Show the secret once only.
2. **Do not use the Supabase service-role secret as the SDK JWT signing key.** `lib/sdk-auth.ts` falls back to it. Use a dedicated high-entropy signing secret or asymmetric keys, include `kid` and a token ID, reduce TTL, and make issued tokens revocable.
3. **Stop placing credentials in URLs.** Command and handoff GET use `?key=`. Query strings are routinely captured by access logs, proxies, browser history, and monitoring. Use `Authorization: Bearer ...`, remove wildcard CORS, and explicitly allow only the SDK-required headers and origins.
4. **Centralize authorization and validation.** There are many ad hoc route implementations, `any` casts, duplicate service-role client factories, and repeated ownership checks. Create a server-only SDK gateway with Zod request schemas, an authorization helper, a per-key rate limit, and typed error responses. Every service-role query should start from an authorized user/agent/project scope.
5. **Make money state changes atomic.** The outcome-credit deduction in `app/api/sdk/log/route.ts` reads a balance and then writes a calculated balance. A Redis lock helps but is not the database source of truth. Use a database transaction/RPC with an append-only ledger, an idempotency key, a non-negative balance check, and a unique constraint on the charge event.
6. **Correct the step-index validation.** `if (!step_index)` rejects valid zero-based step index `0`. Validate `Number.isInteger(step_index) && step_index >= 0`.

## Database and performance review

The data model is a good foundation: 24 public tables, foreign keys, checks, RLS enabled on all public tables, event/history concepts, and useful indexes. The next step is reducing policy and schema drift.

Supabase reports 118 performance advisories:

- 12 foreign keys without covering indexes. Priority examples: `agent_chats.user_id`, `agent_reasoning_steps.agent_id/task_id`, `ai_timeline_events.agent_id`, `injection_events.agent_id/task_id`, `knowledge_proposals.agent_id/reviewer_id`, and both evaluation-regression FKs.
- 30 policies repeatedly evaluating `auth.uid()` per row. Rewrite expressions as `(select auth.uid())`.
- 54 overlapping permissive RLS policies. Consolidate policies by table/action; policies should target `authenticated`, never use broad unrestricted policies to represent service access.
- 22 currently unused indexes. Do not drop them blindly—usage counters reset after restart—but review them after a representative production period and remove redundant write overhead.

Also add:

- a migration test that applies all migrations to a blank Supabase instance and verifies the generated schema;
- database types generated from the deployed schema, instead of pervasive `any`;
- retention and archival policies for logs, reasoning, checkpoints, chat, and raw payloads;
- request/event idempotency in the database for all ingest routes, not only selected Redis-backed paths;
- a formal workspace/organization model before introducing teams.

## Product gaps

The product has much of the feature breadth. The missing work is mostly trust, packaging, and operational readiness:

1. **Workspace and RBAC:** organizations, members, roles, service accounts, project-level roles, and complete audit history.
2. **Key and agent lifecycle:** create/revoke/rotate keys, per-agent scopes, token/session visibility, emergency kill switch, and a clear offboarding flow.
3. **Reliable execution protocol:** durable command leasing, acknowledgement deadlines, retries/backoff, dead-letter state, and exactly-once/idempotent event semantics.
4. **Policy enforcement:** a structured tool-policy engine with signed approval records, allow/deny rules, spending limits by project/agent/tool, and a documented threat model.
5. **Observability that supports operations:** OpenTelemetry export, alert routing/escalation, SLOs, incident timelines, data retention controls, and cost attribution by project/agent/model.
6. **Trust and compliance:** data classification/redaction, export/delete workflows, encryption/key-management posture, incident response, security documentation, and audit logs that cannot be modified by ordinary users.
7. **Developer experience:** a versioned OpenAPI contract, endpoint compatibility policy, SDK semantic versioning, integration tests against an ephemeral database, and published examples for the supported agent frameworks.
8. **Commercial readiness:** append-only billing ledger, invoice/reconciliation workflow, payment webhook replay protection, tax/currency rules, and usage limits enforced at the transactional boundary.

## Test and code-quality status

`npm test -- --run` completed with **165 passing and 1 failing test**. The failing test is `lib/brain/merge-plan.test.ts`: low evidence is expected to require review but the implementation returns `merge`. This is important because it weakens the product's claimed human-review guardrail.

Code quality concerns:

- widespread `any` in API routes and dashboard code;
- duplicated service-role client construction;
- large route handlers that combine authentication, validation, billing, notifications, and persistence;
- unstructured console logging instead of a consistent correlation-ID-aware logger;
- optional infrastructure frequently fails open (for example, rate limiting without Upstash);
- undocumented distinction between customer-facing APIs, internal APIs, webhook handlers, and health endpoints.

## Recommended 30-day plan

### Week 1: close the trust boundary

1. Disable permissive RLS policies and public execution on privileged functions.
2. Fix handoff, reasoning, and command authorization; add negative cross-tenant tests for every SDK endpoint.
3. Move tokens from query parameters to Authorization headers and restrict CORS.
4. Enable Supabase leaked-password protection and set immutable function search paths.

### Week 2: make ingestion reliable

1. Introduce typed request schemas and the common SDK authorization gateway.
2. Add database-backed idempotency, command lease/ack RPCs, and atomic billing ledger operations.
3. Add all missing foreign-key indexes and simplify RLS policies.

### Weeks 3–4: production readiness

1. Implement scoped, hashed, rotatable agent API keys.
2. Introduce workspace/RBAC and immutable audit events.
3. Make CI run migrations, unit tests, cross-tenant integration tests, and a deploy smoke test.
4. Publish an API contract and establish retention, backup, incident, and alerting procedures.

## What not to do yet

Do not add more dashboard widgets, more agent integrations, or more billing plans before the authorization and key lifecycle work is complete. The differentiator—safe control and governance of agents—depends on those guarantees being real and testable.
