import type { SupabaseClient } from "@supabase/supabase-js"
import { logger } from "../observability"
import { analyzeStaleness } from "./providers/sarvam-staleness"

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
      // 1. Fetch all currently active, CURRENT entries
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

      // 3. Dedicated Sarvam Staleness Analysis for affected entries
      const toUpdate = Array.from(affectedIds)
      
      if (toUpdate.length > 0) {
        for (const id of toUpdate) {
          const existing = existingEntries.find(e => e.id === id)
          const baseReason = staleReasons.get(id) || "Potential semantic dependency change"
          let finalReason = baseReason

          if (existing && context.newEntries.length > 0) {
            try {
              const staleness = await analyzeStaleness(context.newEntries[0], existing)
              if (staleness) {
                finalReason = `${baseReason} (Sarvam assessment: ${staleness.reason})`
              }
            } catch {
              // Fallback to base reason
            }
          }
          
          // Transition to NEEDS_REVIEW
          await this.supabase
            .from("brain_entries")
            .update({
              validity_status: "NEEDS_REVIEW",
              stale_reason: finalReason,
              validated_at: new Date().toISOString(),
              validated_against_version: context.newVersion
            })
            .eq("id", id)
            
          logger.info("Entry marked for review", { meta: { entryId: id, reason: finalReason } })
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
