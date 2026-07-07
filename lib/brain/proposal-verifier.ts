/**
 * Sprint 3 - Proposal Verification Service (Evidence Validation)
 *
 * Checks whether the claims in a proposal can be trusted.
 * Pure function: external fetching is done by the caller, scoring is done here.
 */

import { VerificationError } from "./errors"
import { KnowledgeProposal } from "./types"

export interface VerificationResult {
  verified: boolean
  score: number
  evidence: Evidence[]
  warnings: string[]
}

export interface Evidence {
  type: string
  verified: boolean
  score: number
  details: string
}

export interface EvidenceSource {
  commitExists: boolean
  branchExists: boolean
  filesMatch: boolean
  testsPass: boolean
  humanReviewed: boolean
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function verifyProposal(
  proposal: KnowledgeProposal,
  source: EvidenceSource
): VerificationResult {
  const evidence: Evidence[] = []

  evidence.push(verifyGit(proposal, source))
  evidence.push(verifyFiles(proposal, source))
  evidence.push(verifyTests(source))
  evidence.push(verifyHumanReview(source))

  const score = evidence.reduce((sum, e) => sum + e.score, 0)
  const verified = score >= 50

  const warnings = collectWarnings(evidence)

  return { verified, score, evidence, warnings }
}

// ---------------------------------------------------------------------------
// Evidence checkers
// ---------------------------------------------------------------------------

function verifyGit(proposal: KnowledgeProposal, source: EvidenceSource): Evidence {
  if (!source.commitExists) {
    return createEvidence("git_commit", false, 0, "Commit not found in repository")
  }
  if (!source.branchExists) {
    return createEvidence("git_commit", false, 10, "Commit found but branch does not exist")
  }
  return createEvidence("git_commit", true, 30, "Commit and branch verified")
}

function verifyFiles(proposal: KnowledgeProposal, source: EvidenceSource): Evidence {
  const files = proposal.files_modified
  if (!Array.isArray(files) || files.length === 0) {
    return createEvidence("files", false, 0, "No files declared in proposal")
  }
  if (!source.filesMatch) {
    return createEvidence("files", false, 0, "Declared files do not match actual changes")
  }
  return createEvidence("files", true, 25, `Verified ${files.length} changed file(s)`)
}

function verifyTests(source: EvidenceSource): Evidence {
  if (!source.testsPass) {
    return createEvidence("tests", false, 0, "Tests did not pass")
  }
  return createEvidence("tests", true, 25, "All tests passed")
}

function verifyHumanReview(source: EvidenceSource): Evidence {
  if (!source.humanReviewed) {
    return createEvidence("human_review", false, 0, "No human review recorded")
  }
  return createEvidence("human_review", true, 25, "Human review approved")
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEvidence(
  type: string,
  verified: boolean,
  score: number,
  details: string
): Evidence {
  return { type, verified, score, details }
}

function collectWarnings(evidence: Evidence[]): string[] {
  return evidence
    .filter((e) => !e.verified)
    .map((e) => `${e.type}: ${e.details}`)
}
