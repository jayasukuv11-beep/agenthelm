import { describe, it, expect } from "vitest"
import { validateProposalStructure } from "./proposal-validator"
import { KnowledgeProposal } from "./types"

function makeProposal(overrides: Partial<KnowledgeProposal> = {}): KnowledgeProposal {
  return {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    project_id: "proj-1",
    build_status: "pending",
    summary: "Test proposal",
    decisions: [{ title: "Use Postgres" }],
    files_modified: ["src/index.ts"],
    apis_affected: [],
    db_changes: [],
    ...overrides
  }
}

describe("validateProposalStructure", () => {
  it("passes for a valid proposal", () => {
    const result = validateProposalStructure(makeProposal())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("rejects when id is missing", () => {
    const result = validateProposalStructure(makeProposal({ id: "" }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "MISSING_ID")).toBe(true)
  })

  it("rejects when id is not a UUID", () => {
    const result = validateProposalStructure(makeProposal({ id: "not-a-uuid" }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "INVALID_ID")).toBe(true)
  })

  it("rejects when project_id is missing", () => {
    const result = validateProposalStructure(makeProposal({ project_id: "" }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "MISSING_PROJECT_ID")).toBe(true)
  })

  it("rejects when build_status is invalid", () => {
    const result = validateProposalStructure(makeProposal({ build_status: "invalid" }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "INVALID_STATUS")).toBe(true)
  })

  it("adds warning when summary is empty", () => {
    const result = validateProposalStructure(makeProposal({ summary: "   " }))
    expect(result.warnings).toContain("Summary is empty (whitespace only)")
  })

  it("adds warnings when no entries", () => {
    const result = validateProposalStructure(makeProposal({ decisions: [], apis_affected: [], db_changes: [] }))
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it("rejects when payload is too large", () => {
    const result = validateProposalStructure(makeProposal({
      decisions: Array(1000).fill({ description: "x".repeat(2000) })
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "PAYLOAD_TOO_LARGE")).toBe(true)
  })

  it("rejects suspicious file paths", () => {
    const result = validateProposalStructure(makeProposal({ files_modified: ["../.env"] }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "SUSPICIOUS_FILE_PATH")).toBe(true)
  })

  it("rejects duplicate content_hash", () => {
    const result = validateProposalStructure(
      makeProposal({ content_hash: "abc123" }),
      new Set(["abc123", "def456"])
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === "DUPLICATE_CONTENT_HASH")).toBe(true)
  })
})
