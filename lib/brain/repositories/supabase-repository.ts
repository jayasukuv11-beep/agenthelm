import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  BrainRepository,
  BrainVersionRecord,
  CreateVersionInput,
} from "./brain-repository"
import type { BrainEntryInsert } from "../types"

export class SupabaseBrainRepository implements BrainRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async hasPublishedVersion(projectId: string, proposalId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("brain_versions")
      .select("id")
      .eq("project_id", projectId)
      .contains("built_from_proposals", [proposalId])
      .single()

    if (error && error.code === "PGRST116") return false
    if (error) throw error
    return data != null
  }

  async getLatestVersion(projectId: string): Promise<number | null> {
    const { data, error } = await this.supabase
      .from("brain_versions")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === "PGRST116") return null
    if (error) throw error
    return data?.version ?? null
  }

  async createVersion(input: CreateVersionInput): Promise<BrainVersionRecord> {
    const { data, error } = await this.supabase
      .from("brain_versions")
      .insert({
        project_id: input.project_id,
        parent_version: input.parent_version,
        evolution_reason: input.evolution_reason,
        built_from_proposals: input.built_from_proposals,
        files_changed_count: input.files_changed_count,
        apis_changed_count: input.apis_changed_count,
        entries_added_count: input.entries_added_count,
        entries_deprecated_count: input.entries_deprecated_count,
        evidence_summary: input.evidence_summary,
        merge_plan: input.merge_plan,
      })
      .select()
      .single()

    if (error) throw error
    return data as BrainVersionRecord
  }

  async insertEntries(
    entries: BrainEntryInsert[]
  ): Promise<Array<{ id: string; category: string; title: string }>> {
    if (entries.length === 0) return []

    const { data, error } = await this.supabase
      .from("brain_entries")
      .insert(entries)
      .select("id,category,title")

    if (error) throw error
    return (data ?? []) as Array<{ id: string; category: string; title: string }>
  }

  async deprecateEntries(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const now = new Date().toISOString()
    for (const id of ids) {
      const { error } = await this.supabase
        .from("brain_entries")
        .update({ status: "deprecated", deprecated_at: now })
        .eq("id", id)

      if (error) throw error
    }
  }

  async linkSuperseded(fromId: string, toId: string): Promise<void> {
    const { error } = await this.supabase
      .from("brain_entries")
      .update({ superseded_by: toId })
      .eq("id", fromId)

    if (error) throw error
  }

  async markProposalMerged(proposalId: string, version: number): Promise<void> {
    const { error } = await this.supabase
      .from("knowledge_proposals")
      .update({ build_status: "merged", merged_into_version: version })
      .eq("id", proposalId)

    if (error) throw error
  }

  async recordEvent(event: {
    project_id: string
    agent_id?: string | null
    event_type: string
    title: string
    details: Record<string, unknown>
  }): Promise<void> {
    const { error } = await this.supabase
      .from("ai_timeline_events")
      .insert(event)

    if (error) throw error
  }

  async broadcast(
    projectId: string,
    event: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await this.supabase.channel(`project:${projectId}`).send({
      type: "broadcast",
      event,
      payload,
    })
  }
}
