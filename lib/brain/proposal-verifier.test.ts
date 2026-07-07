import { describe, it, expect } from "vitest"
import { verifyProposal } from "./proposal-verifier"
import type { KnowledgeProposal } from "./types"

function makeProposal(overrides: Partial<KnowledgeProposal> = {}): KnowledgeProposal {
  return {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    project_id: "proj-1",
    build_status: "pending",
    summary: "Test proposal",
    files_modified: ["src/index.ts"],
    ...overrides
  }
}

describe("verifyProposal", () => {
  it("passes when all evidence is strong", () => {
    const proposal = makeProposal({
      files_modified: ["src/auth.ts", "src/user.ts"],
    })
    const result = verifyProposal(proposal, {
      commitExists: true,
      branchExists: true,
      filesMatch: true,
      testsPass: true,
      humanReviewed: true,
    })
    expect(result.verified).toBe(true)
    expect(result.score).toBe(105)
    expect(result.evidence.filter(e => e.verified).length).toBe(4)
  })

  it("passes with partial evidence (score >= 50)", () => {
    const proposal = makeProposal({
      files_modified: ["src/index.ts"],
    })
    const result = verifyProposal(proposal, {
      commitExists: true,
      branchExists: false,
      filesMatch: true,
      testsPass: true,
      humanReviewed: false,
    })
    expect(result.verified).toBe(true)
    expect(result.score).toBe(60)
  })

  it("fails when no evidence is present", () => {
    const proposal = makeProposal({
      files_modified: [],
    })
    const result = verifyProposal(proposal, {
      commitExists: false,
      branchExists: false,
      filesMatch: false,
      testsPass: false,
      humanReviewed: false,
    })
    expect(result.verified).toBe(false)
    expect(result.score).toBe(0)
    expect(result.warnings.length).toBe(4)
  })

  it("warns about unverified evidence", () => {
    const result = verifyProposal(makeProposal(), {
      commitExists: false,
      branchExists: false,
      filesMatch: false,
      testsPass: false,
      humanReviewed: false,
    })
    expect(result.warnings).toContain("git_commit: Commit not found in repository")
    expect(result.warnings).toContain("files: Declared files do not match actual changes")
    expect(result.warnings).toContain("tests: Tests did not pass")
    expect(result.warnings).toContain("human_review: No human review recorded")
  })

  it("gives partial credit when commit exists but branch does not", () => {
    const proposal = makeProposal({
      files_modified: ["src/index.ts"],
    })
    const result = verifyProposal(proposal, {
      commitExists: true,
      branchExists: false,
      filesMatch: true,
      testsPass: true,
      humanReviewed: true,
    })
    const gitEvidence = result.evidence.find(e => e.type === "git_commit")
    expect(gitEvidence?.score).toBe(10)
    expect(gitEvidence?.verified).toBe(false)
  })

  it("rejects when declared files do not match actual changes", () => {
    const proposal = makeProposal({
      files_modified: ["src/auth.ts"],
    })
    const result = verifyProposal(proposal, {
      commitExists: true,
      branchExists: true,
      filesMatch: false,
      testsPass: true,
      humanReviewed: true,
    })
    const fileEvidence = result.evidence.find(e => e.type === "files")
    expect(fileEvidence?.verified).toBe(false)
    expect(fileEvidence?.score).toBe(0)
  })

  it("passes when no files are declared and filesMatch is false", () => {
    const proposal = makeProposal({
      files_modified: [],
    })
    const result = verifyProposal(proposal, {
      commitExists: true,
      branchExists: true,
      filesMatch: false,
      testsPass: true,
      humanReviewed: true,
    })
    expect(result.evidence.find(e => e.type === "files")?.verified).toBe(false)
  })
})
