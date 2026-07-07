/**
 * Sprint 6 — Repository Pattern
 *
 * Abstracts all brain storage operations behind an interface so business
 * logic does not depend on Supabase.  Allows transactions to be simulated
 * in tests and committed as a unit in production (via RPC or stored proc).
 */

import type {
  BrainCategory,
  BrainEntryInsert,
  KnowledgeProposal,
  MergePlan,
  EvidenceResult,
} from "../types"

// ---------------------------------------------------------------------------
// Brain Version
// ---------------------------------------------------------------------------

export interface BrainVersionRecord {
  id: string
  project_id: string
  version: number
  parent_version: number
  evolution_reason?: string | null
  built_from_proposals: string[]
  files_changed_count: number
  apis_changed_count: number
  entries_added_count: number
  entries_deprecated_count: number
  evidence_summary: unknown
  merge_plan: unknown
  created_at: string
}

export type CreateVersionInput = Omit<
  BrainVersionRecord,
  "id" | "created_at" | "version"
> & {
  parent_version: number
}

// ---------------------------------------------------------------------------
// Repository Interface (Port)
// ---------------------------------------------------------------------------

export interface BrainRepository {
  /**
   * Check whether this proposal has already been published.
   * Used for idempotency.
   */
  hasPublishedVersion(
    projectId: string,
    proposalId: string
  ): Promise<boolean>

  /** Return the latest version number for a project. */
  getLatestVersion(projectId: string): Promise<number | null>

  /** Create a new brain version record. Returns the created row. */
  createVersion(input: CreateVersionInput): Promise<BrainVersionRecord>

  /** Insert many brain_entries records. */
  insertEntries(entries: BrainEntryInsert[]): Promise<
    Array<{ id: string; category: string; title: string }>
  >

  /** Mark entries as deprecated. */
  deprecateEntries(ids: string[]): Promise<void>

  /** Point a deprecated entry at its replacement. */
  linkSuperseded(fromId: string, toId: string): Promise<void>

  /** Update a proposal's build_status = "merged". */
  markProposalMerged(proposalId: string, version: number): Promise<void>

  /** Record an event on the ai_timeline_events table. */
  recordEvent(event: {
    project_id: string
    agent_id?: string | null
    event_type: string
    title: string
    details: Record<string, unknown>
  }): Promise<void>

  /** Broadcast a realtime event. */
  broadcast(
    projectId: string,
    event: string,
    payload: Record<string, unknown>
  ): Promise<void>
}
