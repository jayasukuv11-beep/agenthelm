import { describe, it, expect } from "vitest"
import { buildMergePlan, MergePlanEntryInput } from "./merge-plan"
import { AnalysisResult } from "./types"

function makeEntry(category: string, title: string): MergePlanEntryInput {
  return {
    category: category as any,
    title,
    content: { info: "test" },
  }
}

// Build an AnalysisResult from arrays of detected issues
function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    conflicts: overrides.conflicts ?? [],
    duplicates: overrides.duplicates ?? [],
    stale: overrides.stale ?? [],
    similar: overrides.similar ?? [],
    dependencies: overrides.dependencies ?? [],
    metrics: overrides.metrics ?? {
      entries_analyzed: 0,
      conflicts_found: 0,
      duplicates_found: 0,
      stale_found: 0,
      similar_found: 0,
      dependencies_found: 0,
      requires_human_review: false,
      review_reasons: [],
    },
  }
}

const proposalId = "prop-123"

describe("buildMergePlan", () => {
  it("chooses add for new entries without conflicts", () => {
    const entries = [makeEntry("decisions", "Use Postgres")]
    const result = buildMergePlan(proposalId, entries, makeAnalysis(), {
      evidenceScore: 90,
    })

    expect(result.action).toBe("merge")
    expect(result.entries_to_add).toHaveLength(1)
    expect(result.entries_to_add[0].action).toBe("add")
    expect(result.summary.add_count).toBe(1)
    expect(result.summary.supersede_count).toBe(0)
    expect(result.entries_to_reject).toHaveLength(0)
  })

  it("chooses supersede for entries with conflicts", () => {
    const entries = [makeEntry("decisions", "Use Postgres")]
    const analysis = makeAnalysis({
      conflicts: [
        {
          type: "conflict",
          category: "decisions",
          existing_entry_id: "existing-1",
          existing_title: "Existing Use Postgres",
          proposed_title: "Use Postgres",
          reason: "Title matches but content differs",
          severity: "medium",
        },
      ],
      metrics: {
        entries_analyzed: 2,
        conflicts_found: 1,
        duplicates_found: 0,
        stale_found: 0,
        similar_found: 0,
        dependencies_found: 0,
        requires_human_review: true,
        review_reasons: ["Found 1 conflict(s)"],
      },
    })

    const result = buildMergePlan(proposalId, entries, analysis, {
      evidenceScore: 90,
    })

    expect(result.entries_to_add[0].action).toBe("supersede")
    expect(result.entries_to_add[0].existing_entry_id).toBe("existing-1")
    expect(result.entries_to_deprecate).toHaveLength(1)
    expect(result.entries_to_deprecate[0].id).toBe("existing-1")
    expect(result.summary.supersede_count).toBe(1)
  })

  it("chooses replace for similar entries", () => {
    const entries = [makeEntry("decisions", "Use Postgres")]
    const analysis = makeAnalysis({
      similar: [
        {
          type: "similar",
          category: "decisions",
          existing_entry_id: "existing-1",
          existing_title: "Use PostgreSQL",
          proposed_title: "Use Postgres",
          proposed_content: { info: "test" },
          similarity: 0.5,
        },
      ],
      metrics: {
        entries_analyzed: 2,
        conflicts_found: 0,
        duplicates_found: 0,
        stale_found: 0,
        similar_found: 1,
        dependencies_found: 0,
        requires_human_review: true,
        review_reasons: ["Found 1 similar entry(s)"],
      },
    })

    const result = buildMergePlan(proposalId, entries, analysis, {
      evidenceScore: 90,
    })

    expect(result.entries_to_add[0].action).toBe("replace")
    expect(result.entries_to_add[0].existing_entry_id).toBe("existing-1")
    expect(result.entries_to_deprecate).toHaveLength(1)
    expect(result.summary.replace_count).toBe(1)
  })

  it("chooses reject for duplicate entries", () => {
    const entries = [makeEntry("decisions", "Use Postgres")]
    const analysis = makeAnalysis({
      duplicates: [
        {
          type: "duplicate",
          category: "decisions",
          existing_entry_id: "existing-1",
          existing_title: "Use Postgres",
          proposed_title: "Use Postgres",
          similarity: 0.97,
        },
      ],
      metrics: {
        entries_analyzed: 2,
        conflicts_found: 0,
        duplicates_found: 1,
        stale_found: 0,
        similar_found: 0,
        dependencies_found: 0,
        requires_human_review: true,
        review_reasons: ["Found 1 duplicate(s)"],
      },
    })

    const result = buildMergePlan(proposalId, entries, analysis, {
      evidenceScore: 90,
    })

    expect(result.entries_to_reject).toHaveLength(1)
    expect(result.entries_to_add).toHaveLength(0)
    expect(result.summary.reject_count).toBe(1)
    expect(result.requires_human_review).toBe(true)
  })

  it("requires review when evidence score is low", () => {
    const entries = [makeEntry("decisions", "New Decision")]
    const result = buildMergePlan(proposalId, entries, makeAnalysis(), {
      evidenceScore: 50,
    })

    expect(result.action).toBe("review")
    expect(result.requires_human_review).toBe(true)
    expect(result.review_reasons.some((r) => r.includes("Evidence score 50"))).toBe(true)
  })

  it("requires review when high-severity conflicts exist", () => {
    const entries = [makeEntry("decisions", "Use Postgres")]
    const analysis = makeAnalysis({
      conflicts: [
        {
          type: "conflict",
          category: "decisions",
          existing_entry_id: "existing-1",
          existing_title: "Existing",
          proposed_title: "Use Postgres",
          reason: "Conflict",
          severity: "high",
        },
      ],
      metrics: {
        entries_analyzed: 2,
        conflicts_found: 1,
        duplicates_found: 0,
        stale_found: 0,
        similar_found: 0,
        dependencies_found: 0,
        requires_human_review: true,
        review_reasons: ["Found 1 conflict(s)"],
      },
    })

    const result = buildMergePlan(proposalId, entries, analysis, {
      evidenceScore: 90,
    })

    expect(result.action).toBe("review")
    expect(result.requires_human_review).toBe(true)
    expect(result.review_reasons.some((r) => r.includes("High-severity"))).toBe(true)
  })

  it("preserves evidence score in the plan", () => {
    const entries = [makeEntry("decisions", "Test")]
    const result = buildMergePlan(proposalId, entries, makeAnalysis(), {
      evidenceScore: 75,
    })

    expect(result.evidence_score).toBe(75)
  })

  it("handles empty entries", () => {
    const result = buildMergePlan(proposalId, [], makeAnalysis(), {
      evidenceScore: 0,
    })

    expect(result.entries_to_add).toHaveLength(0)
    expect(result.entries_to_deprecate).toHaveLength(0)
    expect(result.entries_to_reject).toHaveLength(0)
    expect(result.summary).toEqual({
      add_count: 0,
      replace_count: 0,
      supersede_count: 0,
      deprecate_count: 0,
      reject_count: 0,
    })
  })
})
