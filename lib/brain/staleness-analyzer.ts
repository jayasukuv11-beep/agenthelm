import type { SupabaseClient } from "@supabase/supabase-js"
import { logger } from "../observability"
import { classifyObservation } from "./providers/sarvam-promotion"

// Assume we have an entry structure with validity_status
export interface StaleAnalysisContext {
  projectId: string
  newVersion: number
  newEntries: Array<{ id: string; category: string; title: string; content: any }>
}

/**
 * Runs asynchronously after publish.
 * Analyzes staleness of existing entries based on dependencies of newly added entries.
 */
export class StalenessAnalyzer {
  constructor(private supabase: SupabaseClient) {}

  async analyze(context: StaleAnalysisContext): Promise<void> {
    const start = Date.now()
    logger.info("Staleness analysis started", { projectId: context.projectId, meta: { version: context.newVersion } })

    try {
      // 1. Fetch all currently active, CURRENT entries that might depend on something
      const { data: existingEntries, error } = await this.supabase
        .from("brain_entries")
        .select("id, category, title, content, validity_status")
        .eq("project_id", context.projectId)
        .eq("status", "active")
        .eq("validity_status", "CURRENT")

      if (error || !existingEntries) {
        throw new Error(error?.message || "Failed to fetch existing entries")
      }

      const affectedIds = new Set<string>()
      const staleReasons = new Map<string, string>()

      // 2. Deterministic Check: Dependencies between APIs and DB
      for (const newEntry of context.newEntries) {
        if (newEntry.category === "apis") {
          // If a new API entry was added, it might affect frontend or database
          for (const existing of existingEntries) {
            if (existing.category === "database" || existing.category === "architecture") {
              const keyword = newEntry.title.toLowerCase()
              if (
                existing.title.toLowerCase().includes(keyword) ||
                JSON.stringify(existing.content).toLowerCase().includes(keyword)
              ) {
                affectedIds.add(existing.id)
                staleReasons.set(existing.id, `Dependent API "${newEntry.title}" changed in v${context.newVersion}`)
              }
            }
          }
        }
        if (newEntry.category === "database") {
          // If a new DB entry was added, it might affect APIs or Architecture
          for (const existing of existingEntries) {
            if (existing.category === "apis" || existing.category === "architecture") {
              const keyword = newEntry.title.toLowerCase()
              if (
                existing.title.toLowerCase().includes(keyword) ||
                JSON.stringify(existing.content).toLowerCase().includes(keyword)
              ) {
                affectedIds.add(existing.id)
                staleReasons.set(existing.id, `Dependent Database schema "${newEntry.title}" changed in v${context.newVersion}`)
              }
            }
          }
        }
      }

      // 3. Semantic Check: use Sarvam to confirm ambiguous dependencies
      // For now, if deterministically affected, we'll run it through Sarvam or just mark as NEEDS_REVIEW.
      // We will only mark as NEEDS_REVIEW, never STALE, as per user requirement.
      const toUpdate = Array.from(affectedIds)
      
      if (toUpdate.length > 0) {
        for (const id of toUpdate) {
          const reason = staleReasons.get(id) || "Potential semantic dependency change"
          
          // Use Sarvam to validate the dependency (Optional semantic filter)
          const observation = `Does the new change "${reason}" invalidate this knowledge?`
          const classification = await classifyObservation(observation) // Reuse existing sarvam integration
          
          // Only transition to NEEDS_REVIEW
          await this.supabase
            .from("brain_entries")
            .update({
              validity_status: "NEEDS_REVIEW",
              stale_reason: classification.promote ? `${reason} (Semantic check: ${classification.reason})` : reason,
              validated_at: new Date().toISOString(),
              validated_against_version: context.newVersion
            })
            .eq("id", id)
            
          logger.info("Entry marked for review", { meta: { entryId: id, reason } })
        }
      }

      logger.info("Staleness analysis completed", {
        projectId: context.projectId,
        meta: {
          version: context.newVersion,
          affectedCount: toUpdate.length,
          durationMs: Date.now() - start
        }
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error("Staleness analysis failed", {
        projectId: context.projectId,
        meta: {
          version: context.newVersion,
          error: message
        }
      })
      
      // Track the failure silently but observably
      await this.supabase.from("ai_timeline_events").insert({
        project_id: context.projectId,
        agent_id: "system",
        event_type: "staleness_analysis_failed",
        title: `Staleness analysis failed for v${context.newVersion}`,
        details: { error: message }
      })
    }
  }
}
