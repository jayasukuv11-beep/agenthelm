export interface EvidenceFactors {
  hasGitCommit: boolean
  testsPassed: boolean
  humanApproved: boolean
  hasMergedPR: boolean
  filesActuallyChanged: boolean
}

export type JsonRecord = Record<string, unknown>

export type BrainCategory = 'decisions' | "apis" | "database"

export interface KnowledgeProposal {
  id: string
  project_id: string
  agent_id?: string | null
  build_status: string
  summary?: string | null
  decisions?: JsonRecord[]
  files_modified?: string[]
  apis_affected?: JsonRecord[]
  db_changes?: JsonRecord[]
  tests_passed?: boolean | null
  human_reviewed?: boolean | null
  commit_sha?: string | null
  branch?: string | null
  content_hash?: string | null
  evidence_score?: number | null
}

// -- Sprint 4 -- Brain Entry and Analysis Types --

export interface BrainEntry {
  id: string
  project_id: string
  category: BrainCategory
  title: string
  content: JsonRecord
  status: "active" | "deprecated"
  created_at: string
  updated_at?: string | null
  confidence?: number
  evidence_score?: number
}

export interface KnowledgeConflict {
  type: "conflict"
  category: BrainCategory
  existing_entry_id: string
  existing_title: string
  proposed_title: string
  reason: string
  severity: "high" | "medium" | "low"
}

export interface KnowledgeDuplicate {
  type: "duplicate"
  category: BrainCategory
  existing_entry_id: string
  existing_title: string
  proposed_title: string
  similarity: number
}

export interface KnowledgeStale {
  type: "stale"
  existing_entry_id: string
  title: string
  category: BrainCategory
  age_days: number
  reason: string
}

export interface KnowledgeSimilar {
  type: "similar"
  category: BrainCategory
  existing_entry_id: string
  existing_title: string
  proposed_title: string
  proposed_content: JsonRecord
  similarity: number
}

export interface KnowledgeDependency {
  type: "dependency"
  source_entry_id: string
  source_title: string
  category: BrainCategory
  target_entry_id: string
  target_title: string
  target_category: BrainCategory
  reason: string
}

export interface AnalysisResult {
  conflicts: KnowledgeConflict[]
  duplicates: KnowledgeDuplicate[]
  stale: KnowledgeStale[]
  similar: KnowledgeSimilar[]
  dependencies: KnowledgeDependency[]
  metrics: AnalysisMetrics
}

export interface AnalysisMetrics {
  entries_analyzed: number
  conflicts_found: number
  duplicates_found: number
  stale_found: number
  similar_found: number
  dependencies_found: number
  requires_human_review: boolean
  review_reasons: string[]
}

// -- Sprint 1-3 Types (unchanged) --

export interface BrainConflict {
  type: BrainCategory
  existing_entry_id: string
  existing_title: string
  existing_content: unknown
  proposed_title: string
  proposed_content: JsonRecord
}

export interface BrainEntryInsert {
  project_id: string
  brain_version_id: string
  category: BrainCategory
  title: string
  content: JsonRecord
  content_hash?: string | null
  source_type: "ai_proposal"
  source_path: string
  confidence: number
  status: "active"
  evidence_score: number
}

export interface EvidenceResult {
  score: number
  details: {
    factors: EvidenceFactors
    weights: Record<string, number>
    reasons: string[]
  }
}

export type MergeAction = "add" | "replace" | "supersede" | "deprecate" | "reject"

export interface MergePlanEntry {
  action: MergeAction
  category: BrainCategory
  title: string
  proposed_content: JsonRecord
  existing_entry_id?: string
  existing_title?: string
}

export interface MergePlan {
  proposal_id: string
  action: "merge" | "review" | "reject"
  evidence_score: number
  entries_to_add: MergePlanEntry[]
  entries_to_deprecate: Array<{
    id: string
    title: string
    category: BrainCategory
    replacement_title: string
  }>
  entries_to_reject: MergePlanEntry[]
  requires_human_review: boolean
  review_reasons: string[]
  summary: {
    add_count: number
    replace_count: number
    supersede_count: number
    deprecate_count: number
    reject_count: number
  }
}
