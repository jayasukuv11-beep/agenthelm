/**
 * Sprint 4 - Knowledge Analyzer
 *
 * Answers: "How does this proposal change the project's knowledge?"
 * Pure functions. No side effects.
 */

import {
  BrainCategory,
  JsonRecord,
  BrainEntry,
  KnowledgeConflict,
  KnowledgeDuplicate,
  KnowledgeStale,
  KnowledgeSimilar,
  KnowledgeDependency,
  AnalysisResult,
} from "./types"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ProposedEntry {
  category: BrainCategory
  title: string
  content: JsonRecord
}

export function analyzeKnowledge(
  proposed: ProposedEntry[],
  existing: BrainEntry[],
  options: {
    staleThresholdDays?: number
    now?: Date
  } = {}
): AnalysisResult {
  const staleThreshold = options.staleThresholdDays ?? 365
  const now = options.now ?? new Date()

  const conflicts = detectConflicts(proposed, existing)
  const duplicates = detectDuplicates(proposed, existing)
  const stale = detectStale(existing, staleThreshold, now)
  const similar = detectSimilar(proposed, existing)
  const dependencies = detectDependencies(proposed, existing)

  const reviewReasons: string[] = []
  if (conflicts.length > 0) reviewReasons.push(`Found ${conflicts.length} conflict(s)`)
  if (duplicates.length > 0) reviewReasons.push(`Found ${duplicates.length} duplicate(s)`)
  if (stale.length > 0) reviewReasons.push(`Found ${stale.length} stale entry(s)`)
  if (similar.length > 0) reviewReasons.push(`Found ${similar.length} similar entry(s)`)
  if (dependencies.length > 0) reviewReasons.push(`Found ${dependencies.length} dependency impact(s)`)

  return {
    conflicts,
    duplicates,
    stale,
    similar,
    dependencies,
    metrics: {
      entries_analyzed: existing.length + proposed.length,
      conflicts_found: conflicts.length,
      duplicates_found: duplicates.length,
      stale_found: stale.length,
      similar_found: similar.length,
      dependencies_found: dependencies.length,
      requires_human_review: reviewReasons.length > 0,
      review_reasons: reviewReasons,
    },
  }
}

// ---------------------------------------------------------------------------
// Conflict Detection
// ---------------------------------------------------------------------------

function detectConflicts(
  proposed: ProposedEntry[],
  existing: BrainEntry[]
): KnowledgeConflict[] {
  const conflicts: KnowledgeConflict[] = []
  const active = existing.filter((e) => e.status === "active")

  for (const entry of proposed) {
    const match = findSimilarTitle(entry, active)
    if (match && hasDifferentContent(entry, match)) {
      conflicts.push({
        type: "conflict",
        category: entry.category,
        existing_entry_id: match.id,
        existing_title: match.title,
        proposed_title: entry.title,
        reason: `Proposed "${entry.title}" conflicts with existing "${match.title}"`,
        severity: "medium",
      })
    }
  }

  return conflicts
}

// ---------------------------------------------------------------------------
// Duplicate Detection
// ---------------------------------------------------------------------------

function detectDuplicates(
  proposed: ProposedEntry[],
  existing: BrainEntry[]
): KnowledgeDuplicate[] {
  const duplicates: KnowledgeDuplicate[] = []
  const active = existing.filter((e) => e.status === "active")

  for (const entry of proposed) {
    for (const brain of active) {
      const score = contentSimilarity(entry.content, brain.content)
      if (score >= 0.85) {
        duplicates.push({
          type: "duplicate",
          category: entry.category,
          existing_entry_id: brain.id,
          existing_title: brain.title,
          proposed_title: entry.title,
          similarity: score,
        })
      }
    }
  }

  return duplicates
}

// ---------------------------------------------------------------------------
// Stale Knowledge Detection
// ---------------------------------------------------------------------------

function detectStale(
  existing: BrainEntry[],
  thresholdDays: number,
  now: Date
): KnowledgeStale[] {
  return existing
    .filter((e) => e.status === "active" && e.updated_at)
    .map((e) => {
      const updated = new Date(e.updated_at!)
      const age = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
      return { entry: e, age }
    })
    .filter((s) => s.age > thresholdDays)
    .map((s) => ({
      type: "stale" as const,
      existing_entry_id: s.entry.id,
      title: s.entry.title,
      category: s.entry.category,
      age_days: Math.round(s.age),
      reason: `Not updated in ${Math.round(s.age)} days (threshold: ${thresholdDays})`,
    }))
}

// ---------------------------------------------------------------------------
// Similar Knowledge Detection
// ---------------------------------------------------------------------------

function detectSimilar(
  proposed: ProposedEntry[],
  existing: BrainEntry[]
): KnowledgeSimilar[] {
  const similar: KnowledgeSimilar[] = []
  const active = existing.filter((e) => e.status === "active")

  for (const entry of proposed) {
    for (const brain of active) {
      if (brain.category !== entry.category) continue
      const score = contentSimilarity(entry.content, brain.content)
      if (score >= 0.3 && score < 0.85) {
        similar.push({
          type: "similar",
          category: entry.category,
          existing_entry_id: brain.id,
          existing_title: brain.title,
          proposed_title: entry.title,
          proposed_content: entry.content,
          similarity: score,
        })
      }
    }
  }

  return similar
}

// ---------------------------------------------------------------------------
// Dependency Impact Detection
// ---------------------------------------------------------------------------

function detectDependencies(
  proposed: ProposedEntry[],
  existing: BrainEntry[]
): KnowledgeDependency[] {
  const deps: KnowledgeDependency[] = []
  const active = existing.filter((e) => e.status === "active")
  const apiEntries = active.filter((e) => e.category === "apis")
  const dbEntries = active.filter((e) => e.category === "database")

  // API changes may affect database entries
  for (const api of proposed.filter((p) => p.category === "apis")) {
    for (const db of findEntriesByKeyword(dbEntries, api.title)) {
      deps.push({
        type: "dependency",
        source_entry_id: "proposed",
        source_title: api.title,
        category: "apis",
        target_entry_id: db.id,
        target_title: db.title,
        target_category: "database",
        reason: `API "${api.title}" may affect DB "${db.title}"`,
      })
    }
  }

  // Database changes may affect API entries
  for (const db of proposed.filter((p) => p.category === "database")) {
    for (const api of findEntriesByKeyword(apiEntries, db.title)) {
      deps.push({
        type: "dependency",
        source_entry_id: "proposed",
        source_title: db.title,
        category: "database",
        target_entry_id: api.id,
        target_title: api.title,
        target_category: "apis",
        reason: `DB "${db.title}" may affect API "${api.title}"`,
      })
    }
  }

  return deps
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSimilarTitle(
  entry: ProposedEntry,
  candidates: BrainEntry[]
): BrainEntry | undefined {
  for (const candidate of candidates) {
    if (candidate.category !== entry.category) continue
    if (stringSimilarity(entry.title, candidate.title) >= 0.6) {
      return candidate
    }
  }
  return undefined
}

function hasDifferentContent(
  entry: ProposedEntry,
  brainEntry: BrainEntry
): boolean {
  return contentSimilarity(entry.content, brainEntry.content) < 0.85
}

function findEntriesByKeyword(
  entries: BrainEntry[],
  keyword: string
): BrainEntry[] {
  const lower = keyword.toLowerCase()
  return entries.filter((e) =>
    e.title.toLowerCase().includes(lower) ||
    JSON.stringify(e.content).toLowerCase().includes(lower)
  )
}

// ---------------------------------------------------------------------------
// Similarity Utilities
// ---------------------------------------------------------------------------

function stringSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) {
    return a.toLowerCase() === b.toLowerCase() ? 1 : 0
  }
  const aGrams = bigrams(a.toLowerCase())
  const bGrams = bigrams(b.toLowerCase())
  return jaccard(aGrams, bGrams)
}

function contentSimilarity(a: JsonRecord, b: JsonRecord): number {
  const aStr = JSON.stringify(a).toLowerCase()
  const bStr = JSON.stringify(b).toLowerCase()
  if (aStr.length < 2 || bStr.length < 2) {
    return aStr === bStr ? 1 : 0
  }
  return jaccard(bigrams(aStr), bigrams(bStr))
}

function bigrams(str: string): Set<string> {
  const grams = new Set<string>()
  for (let i = 0; i < str.length - 1; i++) {
    grams.add(str.slice(i, i + 2))
  }
  return grams
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  const aArray = Array.from(a)
  const intersection = new Set(aArray.filter((x) => b.has(x)))
  const union = new Set([...aArray, ...Array.from(b)])
  return intersection.size / union.size
}
