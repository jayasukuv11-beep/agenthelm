import { describe, it, expect } from "vitest"
import { analyzeKnowledge, ProposedEntry } from "./knowledge-analyzer"
import { BrainEntry } from "./types"

function makeEntry(overrides: Partial<BrainEntry> = {}): BrainEntry {
  return {
    id: "entry-1",
    project_id: "proj-1",
    category: "decisions",
    title: "Use Postgres",
    content: { driver: "postgresql" },
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    ...overrides,
  }
}

function makeProposed(overrides: Partial<ProposedEntry> = {}): ProposedEntry {
  return {
    category: "decisions",
    title: "Use Postgres",
    content: { driver: "postgresql" },
    ...overrides,
  }
}

describe("analyzeKnowledge", () => {
  it("adds a conflict when title is similar but content is different", () => {
    const existing = [makeEntry({ id: "e1", title: "Use Postgres" })]
    const proposed = [makeProposed({ title: "Use Postgres", content: { driver: "mysql" } })]

    const result = analyzeKnowledge(proposed, existing)

    expect(result.conflicts).toHaveLength(1)
    expect(result.conflicts[0].type).toBe("conflict")
    expect(result.conflicts[0].existing_entry_id).toBe("e1")
    expect(result.metrics.conflicts_found).toBe(1)
    expect(result.metrics.requires_human_review).toBe(true)
  })

  it("adds a duplicate when content is very similar", () => {
    const existing = [makeEntry({ id: "e1", title: "Use Postgres", content: { driver: "postgresql" } })]
    const proposed = [makeProposed({ title: "Use Postgres", content: { driver: "postgresql" } })]

    const result = analyzeKnowledge(proposed, existing)

    expect(result.duplicates).toHaveLength(1)
    expect(result.duplicates[0].type).toBe("duplicate")
    expect(result.duplicates[0].similarity).toBeGreaterThanOrEqual(0.85)
  })

  it("detects stale entries older than threshold", () => {
    const oldDate = "2022-01-01T00:00:00Z"
    const existing = [
      makeEntry({ id: "e1", updated_at: oldDate }),
    ]

    const result = analyzeKnowledge([], existing, {
      staleThresholdDays: 100,
      now: new Date("2024-06-01T00:00:00Z"),
    })

    expect(result.stale).toHaveLength(1)
    expect(result.stale[0].type).toBe("stale")
    expect(result.stale[0].age_days).toBeGreaterThan(100)
  })

  it("does not flag recently updated entries as stale", () => {
    const existing = [makeEntry({ id: "e1", updated_at: "2024-01-01T00:00:00Z" })]

    const result = analyzeKnowledge([], existing, {
      staleThresholdDays: 365,
      now: new Date("2024-02-01T00:00:00Z"),
    })

    expect(result.stale).toHaveLength(0)
  })

  it("detects similar content between proposed and existing", () => {
    const existing = [
      makeEntry({ id: "e1", title: "Use Postgres", category: "decisions", content: { driver: "postgresql", pool: true, ssl: true, replica: "none" } }),
    ]
    const proposed = [makeProposed({ title: "Use Postgres", content: { driver: "postgres", pool: true, ssl: false, replica: "active" } })]

    const result = analyzeKnowledge(proposed, existing)

    expect(result.similar).toHaveLength(1)
    expect(result.similar[0].type).toBe("similar")
    expect(result.similar[0].similarity).toBeGreaterThanOrEqual(0.3)
    expect(result.similar[0].similarity).toBeLessThan(0.85)
  })

  it("finds dependency impacts between API and database", () => {
    const proposed = [makeProposed({ category: "apis", title: "users", content: { method: "GET", path: "/users" } })]
    const existing = [
      makeEntry({ id: "e1", category: "database", title: "users table", content: { table: "users" } }),
    ]

    const result = analyzeKnowledge(proposed, existing)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0].type).toBe("dependency")
    expect(result.dependencies[0].target_category).toBe("database")
    expect(result.dependencies[0].target_title).toBe("users table")
  })

  it("finds dependency when database change affects API", () => {
    const proposed = [makeProposed({ category: "database", title: "users", content: { table: "users" } })]
    const existing = [
      makeEntry({ id: "e1", category: "apis", title: "GET /users", content: { method: "GET" } }),
    ]

    const result = analyzeKnowledge(proposed, existing)

    expect(result.dependencies).toHaveLength(1)
    expect(result.dependencies[0].type).toBe("dependency")
    expect(result.dependencies[0].category).toBe("database")
    expect(result.dependencies[0].target_category).toBe("apis")
  })

  it("returns correct metrics with no issues", () => {
    const result = analyzeKnowledge([], [])

    expect(result.metrics.entries_analyzed).toBe(0)
    expect(result.metrics.conflicts_found).toBe(0)
    expect(result.metrics.duplicates_found).toBe(0)
    expect(result.metrics.stale_found).toBe(0)
    expect(result.metrics.similar_found).toBe(0)
    expect(result.metrics.dependencies_found).toBe(0)
    expect(result.metrics.requires_human_review).toBe(false)
    expect(result.metrics.review_reasons).toHaveLength(0)
  })

  it("includes review reasons when issues are found", () => {
    const existing = [
      makeEntry({ id: "e1", updated_at: "2020-01-01T00:00:00Z" }),
    ]

    const result = analyzeKnowledge([], existing, {
      staleThresholdDays: 30,
      now: new Date("2025-01-01T00:00:00Z"),
    })

    expect(result.metrics.review_reasons.length).toBeGreaterThanOrEqual(1)
    expect(result.metrics.review_reasons.some((r) => r.includes("stale"))).toBe(true)
  })
})
