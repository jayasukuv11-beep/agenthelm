import { BrainCategory, JsonRecord, KnowledgeProposal } from "./types"

export function proposalEntries(
  proposal: KnowledgeProposal
): Array<{ category: BrainCategory; title: string; content: JsonRecord }> {
  const entries: Array<{ category: BrainCategory; title: string; content: JsonRecord }> = []

  proposal.decisions?.forEach((decision) => {
    entries.push({
      category: "decisions",
      title: String(decision.title || "Architectural Decision"),
      content: decision
    })
  })

  proposal.apis_affected?.forEach((api) => {
    entries.push({
      category: "apis",
      title: String(api.endpoint || "API Modification"),
      content: api
    })
  })

  proposal.db_changes?.forEach((dbChange) => {
    entries.push({
      category: "database",
      title: String(dbChange.table || "Database Schema Change"),
      content: dbChange
    })
  })

  return entries
}
