import { describe, it, expect } from "vitest"
import { calculateEvidence } from "./evidence"
import { EvidenceFactors } from "./types"

describe("calculateEvidence", () => {
  it("returns full score when all positive factors are true", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: true,
      testsPassed: true,
      humanApproved: true,
      hasMergedPR: true,
      filesActuallyChanged: true
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBe(100)
    expect(result.details.factors).toEqual(factors)
    expect(result.details.weights).toEqual({
      git_commit: 30,
      tests_passed: 20,
      human_review: 40,
      branch_or_pr: 10,
      no_file_changes_penalty: 0
    })
    expect(result.details.reasons).toContain("Git commit supplied")
    expect(result.details.reasons).toContain("Tests passed")
    expect(result.details.reasons).toContain("Human reviewer approved")
    expect(result.details.reasons).toContain("Branch or PR context supplied")
    expect(result.details.reasons).not.toContain("No changed files supplied")
  })

  it("returns zero when all positive factors are false and files not changed", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: false,
      testsPassed: false,
      humanApproved: false,
      hasMergedPR: false,
      filesActuallyChanged: false
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBe(0)
    expect(result.details.reasons).toContain("No changed files supplied")
    expect(result.details.reasons).not.toContain("Git commit supplied")
  })

  it("caps score at 0 (no negative scores)", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: false,
      testsPassed: false,
      humanApproved: false,
      hasMergedPR: false,
      filesActuallyChanged: false
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBe(0)
  })

  it("caps score at 100 (no scores over 100)", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: true,
      testsPassed: true,
      humanApproved: true,
      hasMergedPR: true,
      filesActuallyChanged: true
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it("calculates partial scores correctly", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: true,
      testsPassed: false,
      humanApproved: false,
      hasMergedPR: false,
      filesActuallyChanged: true
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBe(30)
  })

  it("applies file changes penalty when no files changed", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: true,
      testsPassed: true,
      humanApproved: true,
      hasMergedPR: true,
      filesActuallyChanged: false
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBe(80)
  })

  it("includes correct reasons based on factors", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: true,
      testsPassed: true,
      humanApproved: false,
      hasMergedPR: false,
      filesActuallyChanged: false
    }

    const result = calculateEvidence(factors)
    expect(result.details.reasons).toContain("Git commit supplied")
    expect(result.details.reasons).toContain("Tests passed")
    expect(result.details.reasons).not.toContain("Human reviewer approved")
    expect(result.details.reasons).not.toContain("Branch or PR context supplied")
    expect(result.details.reasons).toContain("No changed files supplied")
  })

  it("handles git-commit-only correctly", () => {
    const factors: EvidenceFactors = {
      hasGitCommit: true,
      testsPassed: false,
      humanApproved: false,
      hasMergedPR: false,
      filesActuallyChanged: true
    }

    const result = calculateEvidence(factors)
    expect(result.score).toBe(30)
  })
})
