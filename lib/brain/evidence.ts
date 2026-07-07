import { EvidenceFactors, EvidenceResult } from "./types"

export function calculateEvidence(factors: EvidenceFactors): EvidenceResult {
  const weights = {
    git_commit: factors.hasGitCommit ? 30 : 0,
    tests_passed: factors.testsPassed ? 20 : 0,
    human_review: factors.humanApproved ? 40 : 0,
    branch_or_pr: factors.hasMergedPR ? 10 : 0,
    no_file_changes_penalty: factors.filesActuallyChanged ? 0 : -20
  }

  const reasons: string[] = []
  if (factors.hasGitCommit) reasons.push("Git commit supplied")
  if (factors.testsPassed) reasons.push("Tests passed")
  if (factors.humanApproved) reasons.push("Human reviewer approved")
  if (factors.hasMergedPR) reasons.push("Branch or PR context supplied")
  if (!factors.filesActuallyChanged) reasons.push("No changed files supplied")

  const rawScore = Object.values(weights).reduce((total, value) => total + value, 0)

  return {
    score: Math.max(0, Math.min(100, rawScore)),
    details: {
      factors,
      weights,
      reasons
    }
  }
}
