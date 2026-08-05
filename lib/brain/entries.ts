import { BrainCategory, JsonRecord, KnowledgeProposal } from "./types"

/**
 * Safely normalize a field that may be an array, a JSON-encoded string,
 * or undefined into an array of objects.
 */
function normalizeArray<T>(value: unknown): T[] {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value as T[]
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed as T[]
      // If it's a JSON object (not array), wrap it
      return [parsed] as T[]
    } catch {
      // Not valid JSON - treat as a single string entry
      return [{ text: value }] as T[]
    }
  }
  // Object (not array) - wrap it
  return [value] as T[]
}

export function proposalEntries(
  proposal: KnowledgeProposal
): Array<{ category: BrainCategory; title: string; content: JsonRecord }> {
  const entries: Array<{ category: BrainCategory; title: string; content: JsonRecord }> = []

  const decisions = normalizeArray<JsonRecord>(proposal.decisions)
  decisions.forEach((decision) => {
    entries.push({
      category: "decisions",
      title: String(decision.title || "Architectural Decision"),
      content: decision
    })
  })

  const apis = normalizeArray<JsonRecord>(proposal.apis_affected)
  apis.forEach((api) => {
    entries.push({
      category: "apis",
      title: String(api.endpoint || api.title || "API Modification"),
      content: api
    })
  })

  const dbChanges = normalizeArray<JsonRecord>(proposal.db_changes)
  dbChanges.forEach((dbChange) => {
    entries.push({
      category: "database",
      title: String(dbChange.table || dbChange.title || "Database Schema Change"),
      content: dbChange
    })
  })

  const architecture = normalizeArray<JsonRecord>(proposal.architecture)
  architecture.forEach((arch) => {
    entries.push({
      category: "architecture",
      title: String(arch.title || "Architecture Finding"),
      content: arch
    })
  })

  return entries
}