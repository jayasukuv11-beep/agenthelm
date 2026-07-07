import { describe, it, expect } from "vitest"
import { validateProposal, isLikelyCommitSha, entryKey } from "./validation"
import { BrainCategory, KnowledgeProposal } from "./types"

describe("validateProposal", () => {
  const baseProposal: KnowledgeProposal = {
    id: "p1",
    project_id: "proj1",
    build_status: "pending"
  }

  const makeEntry = (category: BrainCategory, title: string) => ({
    category,
    title,
    content: { info: "test" }
  })

  it("returns no errors for a valid proposal with entries", () => {
    const entries = [makeEntry("decisions", "Decision A")]
    const errors = validateProposal(baseProposal, entries)
    expect(errors).toHaveLength(0)
  })

  it("flags an error when no entries are provided", () => {
    const errors = validateProposal(baseProposal, [])
    expect(errors).toContain("Proposal contains no brain entries to compile")
  })

  it("flags an error when there are empty titles", () => {
    const entries = [
      { category: "decisions" as BrainCategory, title: "   ", content: {} },
      { category: "apis" as BrainCategory, title: "Normal Title", content: {} }
    ]
    const errors = validateProposal(baseProposal, entries)
    expect(errors).toContain("Proposal contains an empty decisions title")
  })

  it("flags an error when payload exceeds size limit", () => {
    const largeProposal: KnowledgeProposal = {
      ...baseProposal,
      decisions: Array(100).fill({ description: "x".repeat(2000) })
    }
    const errors = validateProposal(largeProposal, [makeEntry("decisions", "Valid")])
    expect(errors).toContain("Proposal payload is too large")
  })

  it("accumulates multiple errors", () => {
    const largeProposal: KnowledgeProposal = {
      ...baseProposal,
      decisions: Array(100).fill({ description: "x".repeat(2000) })    }
    const errors = validateProposal(largeProposal, [])
    expect(errors.length).toBeGreaterThanOrEqual(2)
    expect(errors).toContain("Proposal contains no brain entries to compile")
    expect(errors).toContain("Proposal payload is too large")
  })
})

describe("isLikelyCommitSha", () => {
  it("returns true for valid 7-character hex strings", () => {
    expect(isLikelyCommitSha("abc1234")).toBe(true)
  })

  it("returns true for valid 40-character hex strings", () => {
    expect(isLikelyCommitSha("a".repeat(40))).toBe(true)
  })

  it("returns true for 32-character hex strings", () => {
    expect(isLikelyCommitSha("abc123def4567890123456789012345")).toBe(true)
  })

  it("returns false for non-hex strings", () => {
    expect(isLikelyCommitSha("notahex")).toBe(false)
  })

  it("returns false for hex that is too short", () => {
    expect(isLikelyCommitSha("abc12")).toBe(false)
  })

  it("returns false for hex that is too long", () => {
    expect(isLikelyCommitSha("a".repeat(41))).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isLikelyCommitSha("")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isLikelyCommitSha(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isLikelyCommitSha(undefined)).toBe(false)
  })
})

describe("entryKey", () => {
  it("combines category and lowercase title", () => {
    expect(entryKey("decisions", "My Decision")).toBe("decisions:my decision")
  })

  it("handles special characters in title", () => {
    expect(entryKey("apis", "GET /users/:id")).toBe("apis:get /users/:id")
  })

  it("handles empty strings", () => {
    expect(entryKey("decisions", "")).toBe("decisions:")
  })
})
