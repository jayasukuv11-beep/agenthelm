# AgentHelm Feature Freeze Plan

## CTO Directive

AgentHelm should not add new product surface area for the next 6-8 weeks.

The product already has enough pillars:

- Project Brain
- Knowledge Proposals
- Brain Compiler
- Context Injection
- Agent Presence
- File Ownership
- Dashboard
- SDK
- Partial Git integration
- Timeline
- Safety controls

The problem is not missing features. The problem is that the existing features are not yet deeply integrated into one reliable workflow.

## Product Loop

Everything should strengthen this loop:

```text
Agent starts
  -> gets Project Brain context
  -> works on the task
  -> creates a Knowledge Proposal
  -> Brain Compiler validates and merges it
  -> Project Brain is updated
  -> next agent receives better context
```

This loop is the product. Anything that does not make this loop faster, safer, more trustworthy, or more effortless should wait.

## Non-Goals During Freeze

Do not add:

- Jira integration
- GitHub Issues integration
- RBAC
- Export features
- More dashboard panels
- More billing features
- More agent framework adapters
- More notification channels

Only build work that improves the core loop.

## Engineering Themes

### 1. Brain Quality

Question: can developers trust the Brain?

Work:

- Replace append-only behavior with merge, supersede, and deprecate flows.
- Store evidence as first-class data: Git commit, test result, branch or PR, human review.
- Show version deltas: added, updated, deprecated.
- Track knowledge freshness for every active entry.
- Prevent contradictory active knowledge for the same topic.

KPI: Trust Score, the percentage of active knowledge backed by evidence.

### 2. Context Intelligence

Current behavior is close to search and return entries. The goal is task-aware injection.

Work:

- Rank entries by task relevance.
- Deduplicate overlapping entries.
- Chunk large entries.
- Enforce token budgets.
- Order context by usefulness.
- Expand dependencies only when useful.
- Return less context when less context is better.

KPI: Context Relevance, the percentage of injected context the agent actually uses or rates useful.

### 3. Brain Compiler

The Brain Compiler is the core engine.

Target pipeline:

```text
Proposal
  -> validate payload
  -> collect evidence
  -> detect conflicts
  -> produce merge plan
  -> compile
  -> publish Brain version
```

Work:

- Validate proposal shape and size.
- Reject malformed or duplicate proposals.
- Detect conflicts by category, title, affected files, APIs, and database objects.
- Generate explicit merge plans before mutating brain entries.
- Link deprecated entries to superseding entries.
- Make compiler errors observable in timeline and proposal status.

KPI: Merge Accuracy, the percentage of merged proposals that do not need later correction.

### 4. Git Integration

Do not add more external systems yet. Perfect the existing Git evidence layer.

Work:

- Verify that changed files in proposals match Git.
- Lower evidence score when a proposal claims changes that Git cannot confirm.
- Detect documentation-only changes versus implementation changes.
- Extract repository facts from README, architecture docs, OpenAPI specs, SQL migrations, package files, and config.
- Feed repository scanner output into the same proposal/compiler pipeline instead of bypassing it.

KPI: Evidence Coverage, the percentage of merged proposals with verified repository evidence.

### 5. Presence

Presence should communicate meaningful state, not just online or running.

Target states:

- Running
- Editing file
- Waiting for review
- Blocked
- Recovering
- Offline

Work:

- Track current file accurately.
- Expire stale heartbeats.
- Detect duplicate agents.
- Surface blocked or waiting states in the dashboard.
- Make file ownership conflicts obvious.

KPI: Presence Freshness, the percentage of agents reporting accurate live state.

### 6. Dashboard

Dashboards should answer questions, not just display data.

Work:

- Replace abstract health numbers with reasons.
- Show missing documentation by domain.
- Show stale knowledge by area.
- Show incomplete evidence.
- Show pending conflicts that block trust.
- Make every panel answer: what should the user do next?

KPI: Actionability, the percentage of dashboard panels that surface a concrete next action.

### 7. SDK

The SDK should become almost invisible.

Current:

```python
agent.publish_proposal(...)
```

Target:

```python
agent.finish()
```

The SDK should gather metadata automatically.

Work:

- Auto-detect branch.
- Auto-detect changed files.
- Auto-attach commit SHA when available.
- Auto-run or ingest test status.
- Auto-submit a proposal at task completion.
- Improve errors so first-time users know exactly what failed.

KPI: Time to First Success, time from install to first successful Project Brain interaction.

### 8. Security

Do not add RBAC during the freeze. Harden proposal validation first.

Work:

- Detect secrets in proposals.
- Detect prompt-injection-like content.
- Reject oversized payloads.
- Reject malformed data.
- Reject duplicate content hashes.
- Validate project and agent ownership.
- Ensure proposals cannot poison active Brain entries without evidence or review.

KPI: Proposal Safety, the percentage of rejected unsafe proposals before they reach compilation.

### 9. Repository Intelligence

Repository scanning should improve Brain quality, not become a separate feature.

Work:

- Scan repository files on a schedule or explicit trigger.
- Extract durable project facts.
- Submit scanner output as Knowledge Proposals.
- Let the Brain Compiler merge repository knowledge the same way it merges agent knowledge.
- Prefer code, schema, and tests over prose when evidence conflicts.

KPI: Brain Freshness, the percentage of active knowledge confirmed by recent repository evidence.

### 10. Developer Experience

AgentHelm must deliver value quickly.

Questions:

- Can a developer install in 3 minutes?
- Can they understand Project Brain in 30 seconds?
- Can they get value today?
- Can they connect an agent, receive context, and publish a proposal without reading deep docs?

Work:

- Improve README positioning.
- Fix broken text encoding in docs.
- Provide one excellent quickstart.
- Provide one complete local demo of the core loop.
- Make errors actionable.

KPI: Time to First Success.

## Sprint Plan

### Progress

- Sprint 1 started: Brain Compiler now creates and persists a merge plan before mutating Brain entries.
- Sprint 1 started: evidence details are stored separately from the numeric evidence score.
- Sprint 1 started: invalid empty or oversized proposals are rejected before compilation.
- Sprint 1 started: deprecated Brain entries are linked to replacement entries through `superseded_by`.
- Sprint 1 started: Project Brain health now reports Trust Score, latest compile deltas, and action items.
- Sprint 2 started: context injection now ranks, deduplicates, token-budgets, and returns source metadata.
- Sprint 3 started: compiler evidence now only awards Git commit points for commit-like SHAs.
- Sprint 4 started: Python SDK proposals now auto-detect Git branch, commit SHA, and changed files when available.

### Sprint 1: Brain Compiler

Goal: make Brain updates trustworthy.

Deliverables:

- Merge plan object before mutation.
- Supersede and deprecate behavior.
- Evidence score stored with reason breakdown.
- Deprecated entries link to superseding entries.
- Conflict status visible in timeline.

Done when:

- A proposal can add new knowledge.
- A proposal can supersede old knowledge.
- A conflicting proposal pauses for review.
- A reviewer can approve or reject.
- The resulting Brain version shows added, updated, and deprecated counts.

### Sprint 2: Context Injection

Goal: make injected context useful, not just large.

Deliverables:

- Task-aware ranking.
- Deduplication.
- Token budget enforcement.
- Stable context ordering.
- Basic compression for long entries.

Done when:

- The inject route returns fewer, better entries.
- Context includes source/evidence metadata.
- Agents can request context for a task and get relevant entries first.

### Sprint 3: Git and Repository Evidence

Goal: make Git a first-class evidence source.

Deliverables:

- Proposal commit verification.
- Changed-file verification.
- Repository scanner for README, docs, migrations, package files, and API specs.
- Scanner output submitted as Knowledge Proposals.

Done when:

- Proposals with unverifiable Git claims lose evidence score.
- Repository facts can enter the Brain without bypassing the compiler.

### Sprint 4: SDK

Goal: make publishing knowledge effortless.

Deliverables:

- Auto branch detection.
- Auto changed-file detection.
- Auto commit detection.
- Better proposal errors.
- `agent.finish()` design or prototype.

Done when:

- A developer can connect an agent, run work, and publish a useful proposal with minimal manual fields.

### Sprint 5: Dashboard

Goal: make the dashboard actionable.

Deliverables:

- Brain health reasons.
- Proposal queue actions.
- Conflict review flow.
- Stale knowledge indicators.
- Evidence gaps by area.

Done when:

- Every Project Brain panel tells the user what needs attention.

## Core KPIs

| Component | KPI | Definition |
| --- | --- | --- |
| Brain | Trust Score | Percentage of active knowledge backed by Git, tests, review, or repository evidence. |
| Compiler | Merge Accuracy | Percentage of proposals merged without later correction. |
| Context Injection | Relevance | Percentage of injected context actually used or rated useful. |
| Presence | Freshness | Percentage of agents reporting accurate live state. |
| SDK | Time to First Success | Time from install to first successful Project Brain interaction. |
| Dashboard | Actionability | Percentage of panels that show a concrete next action. |

## Operating Rule

During this freeze, every issue must answer yes to at least one question:

1. Does it make the Project Brain more trustworthy?
2. Does it make context injection more useful?
3. Does it make proposal compilation safer or more accurate?
4. Does it make the core loop easier for developers?

If the answer is no, defer it.

## Final Instruction

No new features for 6-8 weeks.

Make this workflow excellent:

```text
Connect
  -> get context
  -> work
  -> publish proposal
  -> compile Brain
  -> improve next session
```
