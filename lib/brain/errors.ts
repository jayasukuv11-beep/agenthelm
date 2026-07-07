/**
 * Sprint 3 — Structured error types for Proposal Validation & Verification.
 *
 * Every rejected proposal carries a typed error so callers can handle
 * specific failure modes without parsing string messages.
 */

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface VerificationError {
  claim: string
  message: string
  code: string
}

export class ProposalValidationError extends Error {
  readonly errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super(`Proposal validation failed: ${errors.map((e) => `${e.field} (${e.code})`).join(", ")}`)
    this.errors = errors
    Object.setPrototypeOf(this, ProposalValidationError.prototype)
  }
}

export class ProposalVerificationError extends Error {
  readonly errors: VerificationError[]
  readonly score: number

  constructor(errors: VerificationError[], score: number) {
    super(`Proposal verification failed: ${errors.map((e) => `${e.claim} (${e.code})`).join(", ")}`)
    this.errors = errors
    this.score = score
    Object.setPrototypeOf(this, ProposalVerificationError.prototype)
  }
}

export class DuplicateProposalError extends Error {
  readonly content_hash: string

  constructor(content_hash: string) {
    super(`Duplicate proposal detected: content_hash ${content_hash}`)
    this.content_hash = content_hash
    Object.setPrototypeOf(this, DuplicateProposalError.prototype)
  }
}

export class EvidenceError extends Error {
  readonly claim: string
  readonly details: string

  constructor(claim: string, details: string) {
    super(`Evidence error [${claim}]: ${details}`)
    this.claim = claim
    this.details = details
    Object.setPrototypeOf(this, EvidenceError.prototype)
  }
}
