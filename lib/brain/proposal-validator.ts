/**
 * Sprint 3 - Proposal Validator (Entry-Point Validation)
 *
 * Checks whether a proposal is well-formed before it enters the pipeline.
 * Pure functions. No side effects.
 */

import { ValidationError } from "./errors"
import { KnowledgeProposal } from "./types"

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

export const MAX_SUMMARY_LENGTH = 2000
export const MAX_PAYLOAD_SIZE = 100_000

export const VALID_STATUSES = [
  "pending",
  "merged",
  "rejected",
  "reviewing",
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function validateProposalStructure(
  proposal: KnowledgeProposal,
  existingContentHashes?: Set<string>
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []

  validateId(proposal, errors)
  validateProjectId(proposal, errors)
  validateStatus(proposal, errors)
  validateSummary(proposal, errors, warnings)
  validatePayloadSize(proposal, errors)
  validateEntries(proposal, errors, warnings)
  validateFileReferences(proposal, errors)
  validateContentHash(proposal, errors, existingContentHashes)

  return { valid: errors.length === 0, errors, warnings }
}

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

function validateId(proposal: KnowledgeProposal, errors: ValidationError[]): void {
  if (!isNonEmptyString(proposal.id)) {
    errors.push({ field: "id", message: "Proposal id is required", code: "MISSING_ID" })
  } else if (!isValidUuid(proposal.id)) {
    errors.push({ field: "id", message: "Proposal id must be a valid UUID", code: "INVALID_ID" })
  }
}
function validateProjectId(proposal: KnowledgeProposal, errors: ValidationError[]): void {
  if (!isNonEmptyString(proposal.project_id)) {
    errors.push({ field: "project_id", message: "Project id is required", code: "MISSING_PROJECT_ID" })
  }
}

function validateStatus(proposal: KnowledgeProposal, errors: ValidationError[]): void {
  if (!isNonEmptyString(proposal.build_status)) {
    errors.push({ field: "build_status", message: "Build status is required", code: "MISSING_STATUS" })
    return
  }
  if (!VALID_STATUSES.includes(proposal.build_status)) {
    errors.push({
      field: "build_status",
      message: `Invalid status "${proposal.build_status}". Must be one of: ${VALID_STATUSES.join(", ")}`,
      code: "INVALID_STATUS"
    })
  }
}

function validateSummary(
  proposal: KnowledgeProposal,
  errors: ValidationError[],
  warnings: string[]
): void {
  if (proposal.summary === null || proposal.summary === undefined) {
    return
  }
  if (typeof proposal.summary !== "string") {
    errors.push({ field: "summary", message: "Summary must be a string", code: "INVALID_SUMMARY_TYPE" })
    return
  }
  if (proposal.summary.length > MAX_SUMMARY_LENGTH) {
    errors.push({
      field: "summary",
      message: `Summary exceeds maximum length of ${MAX_SUMMARY_LENGTH} characters`,
      code: "SUMMARY_TOO_LONG"
    })
  }
  if (proposal.summary.trim().length === 0) {
    warnings.push("Summary is empty (whitespace only)")
  }
}

function validatePayloadSize(proposal: KnowledgeProposal, errors: ValidationError[]): void {
  const serialized = JSON.stringify({
    decisions: proposal.decisions ?? [],
    apis_affected: proposal.apis_affected ?? [],
    db_changes: proposal.db_changes ?? [],
    files_modified: proposal.files_modified ?? [],
    summary: proposal.summary ?? ""
  })

  if (serialized.length > MAX_PAYLOAD_SIZE) {
    errors.push({
      field: "payload",
      message: `Proposal payload exceeds maximum size of ${MAX_PAYLOAD_SIZE} bytes`,
      code: "PAYLOAD_TOO_LARGE"
    })
  }
}

function validateEntries(
  proposal: KnowledgeProposal,
  errors: ValidationError[],
  warnings: string[]
): void {
  if (!Array.isArray(proposal.decisions) || proposal.decisions.length === 0) {
    warnings.push("No decisions entries in proposal")
  }
  if (!Array.isArray(proposal.apis_affected) || proposal.apis_affected.length === 0) {
    warnings.push("No API entries in proposal")
  }
  if (!Array.isArray(proposal.db_changes) || proposal.db_changes.length === 0) {
    warnings.push("No database entries in proposal")
  }
}

function validateFileReferences(
  proposal: KnowledgeProposal,
  errors: ValidationError[]
): void {
  if (!proposal.files_modified) return

  if (!Array.isArray(proposal.files_modified)) {
    errors.push({
      field: "files_modified",
      message: "files_modified must be an array",
      code: "INVALID_FILES_TYPE"
    })
    return
  }

  for (const file of proposal.files_modified) {
    if (typeof file !== "string" || file.trim() === "") {
      errors.push({
        field: "files_modified",
        message: "files_modified must contain only non-empty strings",
        code: "INVALID_FILE_ENTRY"
      })
      break
    }
    if (file.includes("..")) {
      errors.push({
        field: "files_modified",
        message: `Suspicious file path: ${file}`,
        code: "SUSPICIOUS_FILE_PATH"
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateContentHash(
  proposal: KnowledgeProposal,
  errors: ValidationError[],
  existingContentHashes?: Set<string>
): void {
  const hash = proposal.content_hash
  if (hash === undefined || hash === null) return

  if (!isNonEmptyString(hash)) {
    errors.push({
      field: "content_hash",
      message: "content_hash must be a non-empty string",
      code: "INVALID_CONTENT_HASH"
    })
    return
  }

  if (existingContentHashes && existingContentHashes.has(hash)) {
    errors.push({
      field: "content_hash",
      message: `Duplicate proposal detected: content_hash ${hash}`,
      code: "DUPLICATE_CONTENT_HASH"
    })
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function isValidUuid(value: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(value)
}
