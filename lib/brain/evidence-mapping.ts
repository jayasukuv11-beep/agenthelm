/**
 * Maps between VerificationResult and EvidenceResult for the pipeline.
 * Pure functions.
 */

import { EvidenceResult } from "./types"
import { EvidenceSource } from "./proposal-verifier"

/**
 * Build an EvidenceResult from a verification score and source.
 * Keeps backward compatibility with the old pipeline state shape.
 */
export function sourceToEvidenceResult(
  score: number,
  source: EvidenceSource
): EvidenceResult {
  return {
    score,
    details: {
      factors: {
        hasGitCommit: source.commitExists,
        testsPassed: source.testsPass,
        humanApproved: source.humanReviewed,
        hasMergedPR: source.branchExists,
        filesActuallyChanged: source.filesMatch,
      },
      weights: {
        gitCommit: source.commitExists ? 30 : 0,
        testsPass: source.testsPass ? 20 : 0,
        humanReview: source.humanReviewed ? 40 : 0,
        branch: source.branchExists ? 10 : 0,
        files: source.filesMatch ? 0 : -20,
      },
      reasons: buildReasons(source),
    },
  }
}

/** Build the EvidenceSource from proposal data (backward-compatible default). */
export function createDefaultEvidenceSource(
  hasGitCommit: boolean,
  testsPass: boolean,
  humanReviewed: boolean,
  hasBranch: boolean,
  filesMatch: boolean
): EvidenceSource {
  return {
    commitExists: hasGitCommit,
    testsPass,
    humanReviewed,
    branchExists: hasBranch,
    filesMatch,
  }
}

function buildReasons(source: EvidenceSource): string[] {
  const reasons: string[] = []
  if (source.commitExists) reasons.push("Git commit verified")
  if (source.testsPass) reasons.push("Tests passed")
  if (source.humanReviewed) reasons.push("Human reviewer approved")
  if (source.branchExists) reasons.push("Branch verified")
  if (!source.filesMatch) reasons.push("File match verification failed")
  return reasons
}
