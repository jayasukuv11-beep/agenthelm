/**
 * Sprint 6 — In-Memory BrainRepository (test double)
 *
 * Provides a fully-functional, ACID-like in-memory store for unit tests.
 * No Supabase → fast, deterministic, easy to inspect.
 */

import { randomUUID } from "crypto"
import type {
  BrainRepository,
  BrainVersionRecord,
  CreateVersionInput,
} from "./brain-repository"
import type { BrainEntryInsert } from "../types"

interface InMemoryEvent {
  project_id: string
  agent_id?: string | null
  event_type: string
  title: string
  details: Record<string, unknown>
}

interface InMemoryBroadcast {
  projectId: string
  event: string
  payload: Record<string, unknown>
}

interface DeprecationRecord {
  id: string
  status: "deprecated"
  deprecated_at: string
  superseded_by?: string
}

export class InMemoryBrainRepository implements BrainRepository {
  private versions: BrainVersionRecord[] = []
  private entries: Array<{ id: string } & Record<string, unknown>> = []
  private deprecations: DeprecationRecord[] = []
  private events: InMemoryEvent[] = []
  private broadcasts: InMemoryBroadcast[] = []
  private mergedProposals = new Set<string>()

  // Track transaction state for rollback tests
  private transactionLog: string[] = []

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  async hasPublishedVersion(projectId: string, proposalId: string): Promise<boolean> {
    return this.versions.some(
      (v) =>
        v.project_id === projectId &&
        v.built_from_proposals.includes(proposalId)
    )
  }

  async getLatestVersion(projectId: string): Promise<number | null> {
    const match = [...this.versions]
      .filter((v) => v.project_id === projectId)
      .sort((a, b) => b.version - a.version)[0]
    return match?.version ?? null
  }

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  async createVersion(input: CreateVersionInput): Promise<BrainVersionRecord> {
    const record: BrainVersionRecord = {
      ...input,
      id: randomUUID(),
      version: input.parent_version + 1,
      created_at: new Date().toISOString(),
    }
    this.versions.push(record)
    this.transactionLog.push(`version:${record.id}`)
    return record
  }

  async insertEntries(
    entries: BrainEntryInsert[]
  ): Promise<Array<{ id: string; category: string; title: string }>> {
    const result = entries.map((e) => {
      const id = randomUUID()
      const row = { ...e, id }
      this.entries.push(row)
      this.transactionLog.push(`entry:${id}`)
      return {
        id,
        category: e.category as string,
        title: e.title as string,
      }
    })
    return result
  }

  async deprecateEntries(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.deprecations.push({
        id,
        status: "deprecated",
        deprecated_at: new Date().toISOString(),
      })
      this.transactionLog.push(`deprecate:${id}`)
    }
  }

  async linkSuperseded(fromId: string, toId: string): Promise<void> {
    const dep = this.deprecations.find((d) => d.id === fromId)
    if (dep) {
      dep.superseded_by = toId
    }
    this.transactionLog.push(`link:${fromId}->${toId}`)
  }

  async markProposalMerged(proposalId: string, version: number): Promise<void> {
    this.mergedProposals.add(proposalId)
    this.transactionLog.push(`merged:${proposalId}@v${version}`)
  }

  async recordEvent(event: InMemoryEvent): Promise<void> {
    this.events.push(event)
    this.transactionLog.push(`event:${event.event_type}`)
  }

  async broadcast(
    projectId: string,
    event: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    this.broadcasts.push({ projectId, event, payload })
    this.transactionLog.push(`broadcast:${event}`)
  }

  // -----------------------------------------------------------------------
  // Introspection helpers (test only)
  // -----------------------------------------------------------------------

  get versionCount(): number {
    return this.versions.length
  }

  get entryCount(): number {
    return this.entries.length
  }

  get lastVersion(): BrainVersionRecord | undefined {
    return this.versions[this.versions.length - 1]
  }

  get log(): ReadonlyArray<string> {
    return [...this.transactionLog]
  }

  /** Simulate a transaction rollback for testing. */
  rollback(): void {
    this.versions = []
    this.entries = []
    this.deprecations = []
    this.events = []
    this.broadcasts = []
    this.mergedProposals = new Set()
    this.transactionLog = []
  }

  /** Clear all state. */
  clear(): void {
    this.rollback()
  }
}
