import { BrainCategory, JsonRecord, KnowledgeProposal } from "./types"

export function validateProposal(
  proposal: KnowledgeProposal,
  entries: Array<{ category: BrainCategory; title: string; content: JsonRecord }>
): string[] {
  const errors: string[] = []
  const serializedSize = JSON.stringify({
    decisions: proposal.decisions || [],
    apis_affected: proposal.apis_affected || [],
    db_changes: proposal.db_changes || []
  }).length

  if (entries.length === 0) {
    errors.push("Proposal contains no brain entries to compile")
  }

  if (serializedSize > 100_000) {
    errors.push("Proposal payload is too large")
  }

  entries.forEach((entry) => {
    if (!entry.title.trim()) {
      errors.push(`Proposal contains an empty ${entry.category} title`)
    }
  })

  return errors
}

export function isLikelyCommitSha(value?: string | null): boolean {
  return !!value && /^[a-f0-9]{7,40}$/i.test(value)
}

export function entryKey(category: BrainCategory, title: string): string {
  return `${category}:${title.toLowerCase()}`
}
