import { describe, it, expect } from "vitest"
import { InMemoryBrainRepository } from "./in-memory-repository"

describe("InMemoryBrainRepository", () => {
  it("tracks published versions", async () => {
    const repo = new InMemoryBrainRepository()

    const v = await repo.createVersion({
      project_id: "proj-1",
      parent_version: 0,
      evolution_reason: "test",
      built_from_proposals: ["prop-1"],
      files_changed_count: 0,
      apis_changed_count: 0,
      entries_added_count: 1,
      entries_deprecated_count: 0,
      evidence_summary: null,
      merge_plan: null,
    })

    expect(v.version).toBe(1)
    expect(repo.versionCount).toBe(1)

    const exists = await repo.hasPublishedVersion("proj-1", "prop-1")
    expect(exists).toBe(true)

    const notExists = await repo.hasPublishedVersion("proj-1", "prop-2")
    expect(notExists).toBe(false)
  })

  it("returns latest version", async () => {
    const repo = new InMemoryBrainRepository()
    await repo.createVersion({
      project_id: "proj-1", parent_version: 0, evolution_reason: "", built_from_proposals: [],
      files_changed_count: 0, apis_changed_count: 0, entries_added_count: 0,
      entries_deprecated_count: 0, evidence_summary: null, merge_plan: null,
    })
    await repo.createVersion({
      project_id: "proj-1", parent_version: 1, evolution_reason: "", built_from_proposals: [],
      files_changed_count: 0, apis_changed_count: 0, entries_added_count: 0,
      entries_deprecated_count: 0, evidence_summary: null, merge_plan: null,
    })

    const latest = await repo.getLatestVersion("proj-1")
    expect(latest).toBe(2)
  })

  it("inserts entries", async () => {
    const repo = new InMemoryBrainRepository()
    const entries = await repo.insertEntries([
      {
        project_id: "proj-1", brain_version_id: "v1", category: "decisions", title: "Test",
        content: { a: 1 }, source_type: "ai_proposal", source_path: "p1",
        confidence: 80, status: "active", evidence_score: 80,
      } as any,
    ])

    expect(entries).toHaveLength(1)
    expect(entries[0].title).toBe("Test")
    expect(repo.entryCount).toBe(1)
  })

  it("deprecates entries", async () => {
    const repo = new InMemoryBrainRepository()
    await repo.deprecateEntries(["entry-1", "entry-2"])
    expect(repo.entryCount).toBe(0) // deprecateEntries only tracks, doesn't create
  })

  it("links superseded entries", async () => {
    const repo = new InMemoryBrainRepository()
    // linkSuperseded without a matching deprecation is a no-op in test double
    await repo.linkSuperseded("from", "to")
    expect(repo.log.length).toBeGreaterThan(0)
  })

  it("records events", async () => {
    const repo = new InMemoryBrainRepository()
    await repo.recordEvent({
      project_id: "proj-1",
      event_type: "test",
      title: "Test Event",
      details: { foo: "bar" },
    })
    expect(repo.log.some((l) => l.includes("event:test"))).toBe(true)
  })

  it("broadcasts", async () => {
    const repo = new InMemoryBrainRepository()
    await repo.broadcast("proj-1", "brain_compiled", { version: 1 })
    expect(repo.log.some((l) => l.includes("broadcast:brain_compiled"))).toBe(true)
  })

  it("clears all state on rollback", async () => {
    const repo = new InMemoryBrainRepository()
    await repo.createVersion({
      project_id: "proj-1", parent_version: 0, evolution_reason: "", built_from_proposals: [],
      files_changed_count: 0, apis_changed_count: 0, entries_added_count: 0,
      entries_deprecated_count: 0, evidence_summary: null, merge_plan: null,
    })
    expect(repo.versionCount).toBe(1)

    repo.rollback()
    expect(repo.versionCount).toBe(0)
    expect(repo.entryCount).toBe(0)
  })
})
