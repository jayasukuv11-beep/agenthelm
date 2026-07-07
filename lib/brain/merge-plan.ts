/**
 * Sprint 4 — Merge Planner
 *
 * Decides what should happen to each proposed entry:
 * Add | Replace | Supersede | Deprecate | Reject
 *
 * Pure function. Never modifies the Brain. Only produces a plan.
 */

import {
  BrainCategory,
  JsonRecord,
  AnalysisResult,
  MergePlan,
  MergePlanEntry,
  MergeAction,
} from "./types"

export interface MergePlanEntryInput {
  category: BrainCategory
  title: string
  content: JsonRecord
}

/**
 * Build a MergePlan from analysis results.
 *
 * Rules:
 * - Exact duplicate  → reject
 * - Similar (by content but different) → replace (deprecate old)
 * - Conflict (same title, different content) → supersede (deprecate old)
 * - New              → add
 */
export function buildMergePlan(
  proposalId: string,
  entries: MergePlanEntryInput[],
  analysis: AnalysisResult,
  options: {
    evidenceScore?: number
    minEvidenceForAuto?: number
  } = {}
): MergePlan {
  const evidenceScore = options.evidenceScore ?? 0
  const minEvidence = options.minEvidenceForAuto ?? 85

  const entriesToAdd: MergePlanEntry[] = []
  const entriesToDeprecate: Array<{
    id: string
    title: string
    category: BrainCategory
    replacement_title: string
  }> = []
  const entriesToReject: MergePlanEntry[] = []
  const reviewReasons: string[] = [...analysis.metrics.review_reasons]

  // Index analysis by proposed title for fast lookup
  const conflictsByTitle = new Map(
    analysis.conflicts.map((c) => [key(c.category, c.proposed_title), c])
  )
  const duplicatesByTitle = new Map(
    analysis.duplicates.map((d) => [key(d.category, d.proposed_title), d])
  )
  const similarByTitle = new Map(
    analysis.similar.map((s) => [key(s.category, s.proposed_title), s])
  )

  for (const entry of entries) {
    const entryKey = key(entry.category, entry.title)
    const conflict = conflictsByTitle.get(entryKey)
    const duplicate = duplicatesByTitle.get(entryKey)

    // Priority 1: Reject exact duplicates
    if (duplicate && duplicate.similarity >= 0.95) {
      entriesToReject.push({
        action: "reject",
        category: entry.category,
        title: entry.title,
        proposed_content: entry.content,
      })
      reviewReasons.push(`Rejected duplicate: "${entry.title}"`)
      continue
    }

    // Priority 2: Conflict → supersede
    if (conflict) {
      entriesToAdd.push({
        action: "supersede",
        category: entry.category,
        title: entry.title,
        proposed_content: entry.content,
        existing_entry_id: conflict.existing_entry_id,
        existing_title: conflict.existing_title,
      })
      entriesToDeprecate.push({
        id: conflict.existing_entry_id,
        title: conflict.existing_title,
        category: entry.category,
        replacement_title: entry.title,
      })
      continue
    }

    // Priority 3: Similar → replace
    const similar = similarByTitle.get(entryKey)
    if (similar) {
      entriesToAdd.push({
        action: "replace",
        category: entry.category,
        title: entry.title,
        proposed_content: entry.content,
        existing_entry_id: similar.existing_entry_id,
        existing_title: similar.existing_title,
      })
      entriesToDeprecate.push({
        id: similar.existing_entry_id,
        title: similar.existing_title,
        category: entry.category,
        replacement_title: entry.title,
      })
      continue
    }

    // Priority 4: New entry → add
    entriesToAdd.push({
      action: "add",
      category: entry.category,
      title: entry.title,
      proposed_content: entry.content,
    })
  }

  // Determine if human review is required
  const hasHighSeverity = analysis.conflicts.some((c) => c.severity === "high")
  const humanReviewNeeded =
    evidenceScore < minEvidence ||
    hasHighSeverity ||
    entriesToReject.length > 0 ||
    analysis.stale.length > 0 ||
    analysis.dependencies.length > 0

  if (humanReviewNeeded) {
    if (evidenceScore < minEvidence) {
      reviewReasons.push(`Evidence score ${evidenceScore} below auto-merge threshold ${minEvidence}`)
    }
    if (hasHighSeverity) {
      reviewReasons.push("High-severity conflict detected")
    }
    if (entriesToReject.length > 0) {
      reviewReasons.push(` ${entriesToReject.length} entry(s) marked for rejection`)
    }
  }

  return {
    proposal_id: proposalId,
    action: humanReviewNeeded ? "review" : "merge",
    evidence_score: evidenceScore,
    entries_to_add: entriesToAdd,
    entries_to_deprecate: entriesToDeprecate,
    entries_to_reject: entriesToReject,
    requires_human_review: humanReviewNeeded,
    review_reasons: reviewReasons,
    summary: {
      add_count: countByAction(entriesToAdd, "add"),
      replace_count: countByAction(entriesToAdd, "replace"),
      supersede_count: countByAction(entriesToAdd, "supersede"),
      deprecate_count: entriesToDeprecate.length,
      reject_count: entriesToReject.length,
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function key(category: BrainCategory, title: string): string {
  return `${category}:${title.toLowerCase().trim()}`
}

function countByAction(entries: MergePlanEntry[], action: MergeAction): number {
  return entries.filter((e) => e.action === action).length
}
