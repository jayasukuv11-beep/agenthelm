import type { SupabaseClient } from "@supabase/supabase-js"
import {
  BrainCategory,
  BrainConflict,
  EvidenceResult,
  JsonRecord,
  KnowledgeProposal,
  MergePlan
} from "./types"
import { logger } from "../observability"

export async function loadProposal(
  client: SupabaseClient,
  proposalId: string
): Promise<{ proposal?: KnowledgeProposal; error?: string }> {
  const { data, error } = await client
    .from("knowledge_proposals")
    .select("*")
    .eq("id", proposalId)
    .single()

  if (error || !data) {
    return { error: `Proposal ${proposalId} not found` }
  }

  return { proposal: data as KnowledgeProposal }
}

/**
 * @deprecated Use KnowledgeAnalyzer instead. Planned removal: v2.0
 */
export async function findConflicts(
  client: SupabaseClient,
  projectId: string,
  entries: Array<{ category: BrainCategory; title: string; content: JsonRecord }>
): Promise<BrainConflict[]> {
  const conflicts: BrainConflict[] = []

  for (const entry of entries) {
    const { data: existing } = await client
      .from("brain_entries")
      .select("id, title, content")
      .eq("project_id", projectId)
      .eq("category", entry.category)
      .eq("status", "active")
      .ilike("title", `%${entry.title}%`)

    if (existing && existing.length > 0) {
      conflicts.push({
        type: entry.category,
        existing_entry_id: existing[0].id,
        existing_title: existing[0].title,
        existing_content: existing[0].content,
        proposed_title: entry.title,
        proposed_content: entry.content
      })
    }
  }

  return conflicts
}

export async function persistProposalAnalysis(
  client: SupabaseClient,
  proposalId: string,
  evidence: EvidenceResult,
  mergePlan: MergePlan,
  conflicts: BrainConflict[]
): Promise<void> {
  await client
    .from("knowledge_proposals")
    .update({
      evidence_score: evidence.score,
      evidence_details: evidence.details,
      merge_plan: mergePlan,
      conflict_detected: conflicts.length > 0,
      conflict_details: conflicts
    })
    .eq("id", proposalId)
}

export async function rejectProposal(
  client: SupabaseClient,
  proposal: KnowledgeProposal,
  proposalId: string,
  validationErrors: string[]
): Promise<void> {
  await client
    .from("knowledge_proposals")
    .update({
      build_status: "rejected",
      validation_errors: validationErrors,
      review_notes: validationErrors.join("; ")
    })
    .eq("id", proposalId)

  await client
    .from("ai_timeline_events")
    .insert({
      project_id: proposal.project_id,
      agent_id: proposal.agent_id,
      event_type: "proposal_rejected",
      title: `Rejected invalid proposal: ${proposal.summary?.substring(0, 50)}`,
      details: { proposal_id: proposalId, validation_errors: validationErrors }
    })
}

export async function markReviewing(
  client: SupabaseClient,
  proposal: KnowledgeProposal,
  proposalId: string,
  conflicts: BrainConflict[],
  evidence: EvidenceResult,
  mergePlan: MergePlan
): Promise<void> {
  await client
    .from("knowledge_proposals")
    .update({ build_status: "reviewing" })
    .eq("id", proposalId)

  await client
    .from("ai_timeline_events")
    .insert({
      project_id: proposal.project_id,
      agent_id: proposal.agent_id,
      event_type: "conflict_detected",
      title: `Conflict: ${proposal.summary?.substring(0, 50)}`,
      details: { proposal_id: proposalId, conflicts, evidence_score: evidence.score, merge_plan: mergePlan }
    })

  await client.channel(`project:${proposal.project_id}`).send({
    type: "broadcast",
    event: "conflict_detected",
    payload: { proposal_id: proposalId, conflicts, merge_plan: mergePlan }
  })
}

export async function executeMerge(
  client: SupabaseClient,
  proposalId: string,
  proposal: KnowledgeProposal,
  mergePlan: MergePlan,
  evidence: EvidenceResult
): Promise<void> {
  const { newVersion, brainVersionId } = await createBrainVersion(
    client, proposalId, proposal, mergePlan, evidence
  )

  await deprecateOldEntries(client, mergePlan)
  await insertNewBrainEntries(client, proposal, proposalId, brainVersionId, mergePlan, evidence)
  await recordMergeCompletion(client, proposal, proposalId, newVersion, mergePlan, evidence)
}

async function createBrainVersion(
  client: SupabaseClient,
  proposalId: string,
  proposal: KnowledgeProposal,
  mergePlan: MergePlan,
  evidence: EvidenceResult
): Promise<{ newVersion: number; brainVersionId: string }> {
  const { data: latestVersion } = await client
    .from("brain_versions")
    .select("version")
    .eq("project_id", proposal.project_id)
    .order("version", { ascending: false })
    .limit(1)
    .single()

  const parentVersion = latestVersion?.version || 0
  const newVersion = parentVersion + 1

  const { data: brainVersion, error: versionError } = await client
    .from("brain_versions")
    .insert({
      project_id: proposal.project_id,
      version: newVersion,
      parent_version: parentVersion,
      evolution_reason: proposal.summary,
      built_from_proposals: [proposalId],
      built_from_contracts: [proposalId],
      files_changed_count: proposal.files_modified?.length || 0,
      apis_changed_count: proposal.apis_affected?.length || 0,
      entries_added_count: mergePlan.entries_to_add.length,
      entries_deprecated_count: mergePlan.entries_to_deprecate.length,
      evidence_summary: evidence.details,
      merge_plan: mergePlan
    })
    .select("id")
    .single()

  if (versionError) throw versionError

  return { newVersion, brainVersionId: brainVersion.id }
}

async function deprecateOldEntries(
  client: SupabaseClient,
  mergePlan: MergePlan
): Promise<void> {
  const deprecatedAt = new Date().toISOString()
  for (const entry of mergePlan.entries_to_deprecate) {
    await client
      .from("brain_entries")
      .update({ status: "deprecated", deprecated_at: deprecatedAt })
      .eq("id", entry.id)
  }
}

async function insertNewBrainEntries(
  client: SupabaseClient,
  proposal: KnowledgeProposal,
  proposalId: string,
  brainVersionId: string,
  mergePlan: MergePlan,
  evidence: EvidenceResult
): Promise<void> {
  const entriesToInsert = mergePlan.entries_to_add.map((entry) => ({
    project_id: proposal.project_id,
    brain_version_id: brainVersionId,
    category: entry.category,
    title: entry.title,
    content: entry.proposed_content,
    content_hash: proposal.content_hash,
    source_type: "ai_proposal" as const,
    source_path: proposalId,
    confidence: evidence.score || mergePlan.evidence_score || 50,
    status: "active" as const,
    evidence_score: evidence.score || mergePlan.evidence_score || 50
  }))

  if (entriesToInsert.length === 0) return

  const { data: insertedEntries, error: entryError } = await client
    .from("brain_entries")
    .insert(entriesToInsert)
    .select("id, category, title")

  if (entryError) throw entryError

  for (const deprecatedEntry of mergePlan.entries_to_deprecate) {
    const replacement = insertedEntries?.find(
      (entry) => entry.category === deprecatedEntry.category && entry.title === deprecatedEntry.replacement_title
    )

    if (replacement) {
      await client
        .from("brain_entries")
        .update({ superseded_by: replacement.id })
        .eq("id", deprecatedEntry.id)
    }
  }
}

async function recordMergeCompletion(
  client: SupabaseClient,
  proposal: KnowledgeProposal,
  proposalId: string,
  newVersion: number,
  mergePlan: MergePlan,
  evidence: EvidenceResult
): Promise<void> {
  await client
    .from("knowledge_proposals")
    .update({ build_status: "merged", merged_into_version: newVersion })
    .eq("id", proposalId)

  await client
    .from("ai_timeline_events")
    .insert({
      project_id: proposal.project_id,
      agent_id: proposal.agent_id,
      event_type: "brain_compiled",
      title: `Brain compiled to v${newVersion}`,
      details: {
        proposal_id: proposalId,
        entries_added: mergePlan.entries_to_add.length,
        entries_deprecated: mergePlan.entries_to_deprecate.length,
        evidence_score: evidence.score,
        merge_plan: mergePlan
      }
    })

  await client.channel(`project:${proposal.project_id}`).send({
    type: "broadcast",
    event: "brain_compiled",
    payload: { version: newVersion, proposal: proposalId, merge_plan: mergePlan }
  })

  logger.info("Brain compiled", {
    proposalId,
    projectId: proposal.project_id,
    stage: "build",
    status: "ok",
    meta: {
      version: newVersion,
      entriesAdded: mergePlan.entries_to_add.length,
      entriesDeprecated: mergePlan.entries_to_deprecate.length,
    },
  })
}
