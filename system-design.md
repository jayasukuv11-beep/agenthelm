# System Design Reference — for AgentHelm's stack

Load this file when a task involves an architecture-level decision, not routine code changes: new service boundaries, scaling a component, designing an API contract, choosing where state lives, or handling multi-agent coordination at load. Skip it for normal feature work or bug fixes.

Stack in scope: FastAPI (backend), Next.js (dashboard), Supabase/Postgres (primary DB + auth), LangGraph (agent orchestration), Upstash Redis (caching/queues), MCP servers (agent-facing protocol), Cashfree (payments), Resend (email).

---

## 1. API Design (FastAPI + MCP)

**REST endpoints (dashboard/API consumers):**
- Resource-oriented URLs (`/workspaces/{id}/memories`, not `/getMemories?workspace=id`). Nouns, not verbs.
- Version from day one if external consumers exist: `/v1/...`. Since AgentHelm has SDKs on PyPI/npm that people depend on, breaking a response shape without a version bump breaks their agents mid-run — treat this as a hard rule, not a nice-to-have.
- Pagination on any list endpoint that can grow unbounded (memory entries, audit logs) — cursor-based, not offset, once volume is non-trivial (offset pagination degrades badly past ~10k rows and can skip/duplicate rows under concurrent writes).
- Idempotency keys on write endpoints agents call automatically (memory writes, conflict resolutions) — an agent retrying after a timeout shouldn't create duplicate memory entries.

**MCP server design (the actual product surface):**
- MCP tools are the contract multiple agent runtimes (Claude Code, Codex, Antigravity) depend on — treat tool schemas with the same discipline as a public API: additive changes only where possible, deprecate before removing.
- Tool responses should be structured and typed, not just prose — agents parse these programmatically; ambiguous natural-language responses cause silent misinterpretation across different agent runtimes.
- Design for partial failure: if a memory write partially succeeds (e.g., write succeeds but conflict-check fails), the tool response needs to say so explicitly rather than returning a generic success — this is exactly the kind of silent failure that would undercut the "drift detection" claim if an agent thinks a conflict check ran when it didn't.

## 2. Where state lives (Supabase/Postgres vs. Redis)

- **Postgres (source of truth):** anything requiring durability, relationships, or audit trail — memory entries, provenance/git-for-agents history, workspace/user data, conflict records. Use Postgres row-level security (RLS) for multi-tenant isolation rather than app-layer filtering alone — the cross-tenant leak you fixed earlier is exactly the class of bug RLS is designed to make structurally harder to reintroduce.
- **Redis (Upstash) — ephemeral/derived data only:** session caches, rate limiting counters, short-lived locks, pub/sub for live dashboard updates. Never treat Redis as the durable record for anything you'd need to reconstruct provenance from — if Upstash evicts or restarts, nothing you can't afford to lose should live there.
- **Cache invalidation:** if you cache memory reads for latency, invalidate on write rather than relying on TTL alone for anything conflict-detection-relevant — a stale cache read that misses a just-written conflicting fact defeats the entire feature.

## 3. Multi-agent coordination (the part unique to AgentHelm)

This is the area generic system-design advice doesn't cover well, since it's closer to a distributed-systems problem than typical web-app scaling.

- **Concurrent writes from independent agents = a real race condition, not an edge case.** Two agents (Claude Code, Codex) can write conflicting facts near-simultaneously. Decide explicitly: last-write-wins with a conflict flag raised after the fact (simpler, matches "detect drift" positioning), vs. optimistic locking that rejects the second write (safer, but changes the agent's experience from "async collaboration" to "blocking coordination" — a real product decision, not just an implementation detail).
- **Ordering guarantees matter for provenance.** If git-for-agents blame/diff needs to show accurate causal ordering, timestamps alone aren't reliable under concurrent writes from different machines/clocks — consider a monotonic sequence number per workspace, not wall-clock time, for ordering-sensitive operations.
- **Conflict detection is a scaling bottleneck to plan for early.** Naive conflict-checking (compare new write against all existing relevant memory) is fine at demo scale, but as memory volume grows this needs an index/embedding-similarity prefilter rather than brute comparison — decide now whether this is a v1 concern or explicitly deferred, so it's a conscious choice, not a surprise at 10k+ memories.
- **HITL escalation (Telegram) needs a circuit breaker.** If a bug causes repeated false-positive conflicts, don't let it spam a human with alerts — rate-limit or batch escalations per workspace per time window.

## 4. Microservices vs. modular monolith

- Given a solo founder and current stage, a modular monolith (single FastAPI service with clean internal module boundaries: memory, conflict-detection, MCP-tools, auth) is very likely the right call over microservices — microservices buy you independent scaling and deployment at the cost of operational complexity (service discovery, distributed tracing, network failure handling) that isn't worth it until you have distinct load/scaling profiles or separate teams.
- The one component worth considering as a separate deployable early: the **MCP server** itself, since it has different latency/uptime requirements (agents are actively blocked waiting on it mid-task) than the dashboard or billing — a slow dashboard query shouldn't be able to degrade MCP tool response time if they share a process pool.
- Don't split into services just because a diagram looks cleaner — split when you can name the actual scaling, failure-isolation, or deployment reason.

## 5. Load balancing & scaling (as it becomes relevant)

- At current scale, this is very unlikely to be the bottleneck — don't build for load you don't have. Revisit when you have real usage data (concurrent MCP connections, request volume) rather than pre-optimizing.
- When it does matter: MCP server connections may be long-lived (agents hold a session) rather than short request/response — this affects load balancer choice (need one that handles persistent/streaming connections well, e.g. supports WebSocket/SSE affinity if applicable) more than raw request throughput.
- Horizontal scaling of the FastAPI/MCP layer requires conflict-detection and memory writes to not depend on in-process state (e.g., no in-memory locks that only work within a single process) — if you added any in-memory caching/locking during initial build, that's the first thing to check before running multiple instances.

## 6. Reliability & failure handling

- Identify what "AgentHelm is down" means for a user mid-task: does the agent block, fail the write silently, or fall back to no-memory operation? This should be an explicit decision surfaced to the agent/user, not an accident of whatever the timeout behavior happens to be.
- Payments (Cashfree) and email (Resend) are third-party dependencies — failures there should never block core memory/MCP functionality. Isolate them so a Cashfree outage can't take down agent coordination.
- Add health checks and basic uptime monitoring before scaling usage — you want to know about an MCP server outage from monitoring, not from a user's LinkedIn comment.

## 7. When a decision is genuinely a toss-up

State the tradeoff plainly rather than picking silently: name the two options, the axis they trade off on (latency vs. consistency, simplicity vs. flexibility, cost vs. resilience), and a lean — but flag it as a real decision for Tharagesh to confirm rather than deciding unilaterally on something with product-level consequences (e.g., last-write-wins vs. locking changes what "conflict detection" actually means to a user).
