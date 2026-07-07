import { describe, it, expect } from "vitest"
import { BrainPublisher } from "./brain-publisher"
import { InMemoryBrainRepository } from "./repositories/in-memory-repository"
import { BrainRepository } from "./repositories/brain-repository"
import type { KnowledgeProposal, MergePlan, EvidenceResult } from "./types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProposal(): KnowledgeProposal {
  return {
    id: "prop-1",
    project_id: "proj-1",
    build_status: "pending",
    summary: "Test proposal",
  }
}

function makePlan(overrides: Partial<MergePlan> = {}): MergePlan {
  return {
    proposal_id: "prop-1",
    action: "merge" as const,
    evidence_score: 80,
    entries_to_add: [
      { action: "add", category: "decisions", title: "Use Postgres", proposed_content: {} },
    ],
    entries_to_deprecate: [],
    entries_to_reject: [],
    requires_human_review: false,
    review_reasons: [],
    summary: {
      add_count: 1,
      replace_count: 0,
      supersede_count: 0,
      deprecate_count: 0,
      reject_count: 0,
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BrainPublisher", () => {
  it("publishes successfully", async () => {
    const repo = new InMemoryBrainRepository()
    const publisher = new BrainPublisher(repo)
    const result = await publisher.publish("prop-1", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(true)
    expect(result.version).toBe(1)
    expect(result.entries_added).toBe(1)
    expect(result.entries_deprecated).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it("increments version numbers", async () => {
    const repo = new InMemoryBrainRepository()
    const publisher = new BrainPublisher(repo)

    const v1 = await publisher.publish("prop-1", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })
    expect(v1.version).toBe(1)

    const v2 = await publisher.publish("prop-2", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })
    expect(v2.version).toBe(2)
  })

  it("reports failure on repository error", async () => {
    const failingRepo: BrainRepository = {
      hasPublishedVersion: () => Promise.resolve(false),
      getLatestVersion: () => Promise.resolve(0),
      createVersion: () => Promise.reject(new Error("DB down")),
      insertEntries: () => Promise.reject(new Error("DB down")),
      deprecateEntries: () => Promise.reject(new Error("DB down")),
      linkSuperseded: () => Promise.reject(new Error("DB down")),
      markProposalMerged: () => Promise.reject(new Error("DB down")),
      recordEvent: () => Promise.reject(new Error("DB down")),
      broadcast: () => Promise.reject(new Error("DB down")),
    }

    const publisher = new BrainPublisher(failingRepo)
    const result = await publisher.publish("prop-1", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.entries_added).toBe(0)
    expect(result.entries_deprecated).toBe(0)
  })

  it("captures metrics from last publish", async () => {
    const repo = new InMemoryBrainRepository()
    const publisher = new BrainPublisher(repo)
    const plan = makePlan()

    await publisher.publish("prop-1", makeProposal(), plan, {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(publisher.metrics).not.toBeUndefined()
    expect(publisher.metrics!.version).toBe(1)
    expect(publisher.metrics!.entries_added).toBe(1)
    expect(publisher.metrics!.entries_deprecated).toBe(0)
    expect(publisher.metrics!.duration_ms).toBeGreaterThanOrEqual(0)
  })

  it("handles plan with no entries to add", async () => {
    const repo = new InMemoryBrainRepository()
    const publisher = new BrainPublisher(repo)
    const plan = makePlan({
      entries_to_add: [],
      summary: { add_count: 0, replace_count: 0, supersede_count: 0, deprecate_count: 0, reject_count: 0 },
    })

    const result = await publisher.publish("prop-1", makeProposal(), plan, {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(true)
    expect(result.entries_added).toBe(0)
  })

  it("deprecates old entries when plan has deprecations", async () => {
    const repo = new InMemoryBrainRepository()
    const publisher = new BrainPublisher(repo)
    const plan = makePlan({
      entries_to_deprecate: [
        { id: "old-1", title: "Old Entry", category: "decisions", replacement_title: "New Entry" },
      ],
    })

    const result = await publisher.publish("prop-1", makeProposal(), plan, {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(true)
    expect(result.entries_deprecated).toBe(1)
    expect(result.entries_added).toBe(1)
  })

  // -------------------------------------------------------------------
  // Sprint 6 — Idempotency
  // -------------------------------------------------------------------

  it("is idempotent — duplicate publish returns error, not a new version", async () => {
    const repo = new InMemoryBrainRepository()
    const publisher = new BrainPublisher(repo)
    const proposal = makeProposal()

    // First publish
    const first = await publisher.publish("prop-1", proposal, makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })
    expect(first.ok).toBe(true)
    expect(first.version).toBe(1)

    // Second publish of the same proposal
    const second = await publisher.publish("prop-1", proposal, makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })
    expect(second.ok).toBe(false)
    expect(second.errorCode).toBe("ALREADY_PUBLISHED")
    expect(second.retryable).toBe(false)

    // Still only one version
    expect(repo.versionCount).toBe(1)
  })

  // -------------------------------------------------------------------
  // Sprint 6 — Error Classification
  // -------------------------------------------------------------------

  it("marks transient DB errors as retryable", async () => {
    const failingRepo: BrainRepository = {
      hasPublishedVersion: () => Promise.resolve(false),
      getLatestVersion: () => Promise.reject(new Error("Connection timeout")),
      createVersion: () => Promise.reject(new Error("Connection timeout")),
      insertEntries: () => Promise.reject(new Error("Connection timeout")),
      deprecateEntries: () => Promise.reject(new Error("Connection timeout")),
      linkSuperseded: () => Promise.reject(new Error("Connection timeout")),
      markProposalMerged: () => Promise.reject(new Error("Connection timeout")),
      recordEvent: () => Promise.reject(new Error("Connection timeout")),
      broadcast: () => Promise.reject(new Error("Connection timeout")),
    }

    const publisher = new BrainPublisher(failingRepo)
    const result = await publisher.publish("prop-1", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(false)
    expect(result.retryable).toBe(true)
    expect(result.errorCode).toBe("DB_TIMEOUT")
  })

  it("marks validation errors as NOT retryable", async () => {
    const failingRepo: BrainRepository = {
      hasPublishedVersion: () => Promise.resolve(false),
      getLatestVersion: () => Promise.resolve(0),
      createVersion: () => Promise.reject(new Error("validation error: invalid field")),
      insertEntries: () => Promise.reject(new Error("validation error: invalid field")),
      deprecateEntries: () => Promise.reject(new Error("validation error: invalid field")),
      linkSuperseded: () => Promise.reject(new Error("validation error: invalid field")),
      markProposalMerged: () => Promise.reject(new Error("validation error: invalid field")),
      recordEvent: () => Promise.reject(new Error("validation error: invalid field")),
      broadcast: () => Promise.reject(new Error("validation error: invalid field")),
    }

    const publisher = new BrainPublisher(failingRepo)
    const result = await publisher.publish("prop-1", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(false)
    expect(result.retryable).toBe(false)
  })

  // -------------------------------------------------------------------
  // Sprint 6 — Transaction Rollback (simulated via repository)
  // -------------------------------------------------------------------

  it("does not leave partial state when createVersion fails", async () => {
    let callCount = 0
    const repo = new InMemoryBrainRepository()

    // Interposing proxy: delegates to repo but overrides createVersion
    const failingRepo: BrainRepository = {
      hasPublishedVersion: (...args) => repo.hasPublishedVersion(...args),
      getLatestVersion: (...args) => repo.getLatestVersion(...args),
      createVersion: () => {
        callCount++
        return Promise.reject(new Error("DB timeout"))
      },
      insertEntries: (...args) => repo.insertEntries(...args),
      deprecateEntries: (...args) => repo.deprecateEntries(...args),
      linkSuperseded: (...args) => repo.linkSuperseded(...args),
      markProposalMerged: (...args) => repo.markProposalMerged(...args),
      recordEvent: (...args) => repo.recordEvent(...args),
      broadcast: (...args) => repo.broadcast(...args),
    }

    const publisher = new BrainPublisher(failingRepo)
    const result = await publisher.publish("prop-1", makeProposal(), makePlan(), {
      score: 80, details: { factors: {} as any, weights: {}, reasons: [] },
    })

    expect(result.ok).toBe(false)
    // No versions should have been created
    expect(repo.versionCount).toBe(0)
    expect(callCount).toBe(1)
  })
})
