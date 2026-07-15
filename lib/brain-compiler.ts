import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { BrainPipeline } from "./brain/pipeline"
import { logger } from "./observability"

let _supabaseAdmin: SupabaseClient | null = null
const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if ((!url || !key) && process.env.NEXT_PHASE !== 'phase-production-build') {
        throw new Error("FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required but not set.");
      }
      _supabaseAdmin = createClient(
        url || "https://placeholder.supabase.co",
        key || "placeholder",
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
    const value = Reflect.get(_supabaseAdmin, prop)
    return typeof value === 'function' ? value.bind(_supabaseAdmin) : value
  }
}) as SupabaseClient

export async function compileProposal(proposalId: string) {
  try {
    const pipeline = new BrainPipeline(supabaseAdmin)
    const result = await pipeline.compile(proposalId)

    if (result.outcome === "error" || result.outcome === "rejected") {
      logger.error("Brain Compiler failed", {
        proposalId,
        traceId: result.traceId,
        errorCode: result.errorCode,
        meta: { outcome: result.outcome, error: result.error },
      })

      await supabaseAdmin
        .from("knowledge_proposals")
        .update({
          build_status: "rejected",
          review_notes: result.outcome === "error"
            ? `System Compiler Error: ${result.error || 'Unknown compiler error'}`
            : `Conflict Detected: ${result.error || 'Compiler validation rejected the proposal'}`
        })
        .eq("id", proposalId)
    }

    return result
  } catch (error) {
    logger.error("Brain Compiler exception", {
      proposalId,
      errorCode: "COMPILER_EXCEPTION",
      meta: { error: error instanceof Error ? error.message : String(error) },
    })

    await supabaseAdmin
      .from("knowledge_proposals")
      .update({
        build_status: "rejected",
        review_notes: `System Compiler Exception: ${error instanceof Error ? error.message : "Compiler crashed"}`
      })
      .eq("id", proposalId)
  }
}

export async function resolveConflict(
  proposalId: string,
  action: "approve" | "reject",
  reviewerId: string,
  notes?: string
) {
  const { data: proposal } = await supabaseAdmin
    .from("knowledge_proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("build_status", "reviewing")
    .single()

  if (!proposal) {
    throw new Error("Proposal not found or not in reviewing state")
  }

  if (action === "reject") {
    await supabaseAdmin
      .from("knowledge_proposals")
      .update({
        build_status: "rejected",
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || "Rejected by human reviewer"
      })
      .eq("id", proposalId)

    await supabaseAdmin
      .from("ai_timeline_events")
      .insert({
        project_id: proposal.project_id,
        agent_id: proposal.agent_id,
        event_type: "proposal_rejected",
        title: `Rejected: ${proposal.summary?.substring(0, 50)}`,
        details: { proposal_id: proposalId, reviewer_id: reviewerId, notes }
      })

    return { status: "rejected" }
  }

  await supabaseAdmin
    .from("knowledge_proposals")
    .update({
      human_reviewed: true,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes || "Approved by human reviewer",
      build_status: "pending"
    })
    .eq("id", proposalId)

  await compileProposal(proposalId)

  return { status: "approved" }
}
