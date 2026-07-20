import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  BrainCategory,
  EvidenceResult,
  KnowledgeProposal,
  MergePlan,
  JsonRecord,
  AnalysisResult
} from "./types"
import { BrainPublisher } from "./brain-publisher"
import { SupabaseBrainRepository } from "./repositories/supabase-repository"
import { isLikelyCommitSha, validateProposal } from "./validation"
import { validateProposalStructure } from "./proposal-validator"
import { verifyProposal } from "./proposal-verifier"
import { sourceToEvidenceResult, createDefaultEvidenceSource } from "./evidence-mapping"
import { proposalEntries } from "./entries"
import { analyzeKnowledge } from "./knowledge-analyzer"
import { buildMergePlan, MergePlanEntryInput } from "./merge-plan"
import {
  loadProposal,
  persistProposalAnalysis,
  rejectProposal,
  markReviewing,
} from "./database"
import { logger, metrics, generateTraceId } from "../observability"
import { StalenessAnalyzer } from "./staleness-analyzer"

import { classifyObservation } from "./providers/sarvam-promotion"

export type StageName =
  | "intake"
  | "verify"
  | "validate"
  | "analyze"
  | "plan"
  | "build"

export type PipelineOutcome = "merged" | "reviewing" | "rejected" | "error"

export interface StageResult {
  stage: StageName
  ok: boolean
  skipped: boolean
  error?: string
  elapsedMs: number
}

export interface PipelineResult {
  ok: boolean
  proposalId: string
  outcome: PipelineOutcome
  stages: StageResult[]
  traceId: string
  error?: string
  errorCode?: string
  retryable?: boolean
}

interface BuildState {
  proposal: KnowledgeProposal
  evidence: EvidenceResult
  entries: Array<{ category: BrainCategory; title: string; content: JsonRecord }>
  analysis?: AnalysisResult
  mergePlan?: MergePlan
}

type StageResultWithState = { state: Partial<BuildState> }

export class BrainPipeline {
  private readonly supabase: SupabaseClient
  private stages: StageResult[] = []
  private traceId: string = ""
  private projectId: string = ""
  private outcomeOverride?: PipelineOutcome

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async compile(proposalId: string): Promise<PipelineResult> {
    this.stages = []
    this.traceId = generateTraceId()

    const now = Date.now()
    logger.info("Pipeline started", { proposalId, traceId: this.traceId, stage: "intake" })

    let state = await this.stage(proposalId, "intake", () => this.doIntake(proposalId))
    if (!state) {
      return this.done(proposalId, this.outcomeOverride || "error")
    }
    // Collect projectId after intake
    if (state.proposal) {
      this.projectId = state.proposal.project_id
    }

    let partial = await this.stage(proposalId, "verify", () => this.doVerify(state!.proposal))
    if (!partial) return this.done(proposalId, "error")
    state = { ...state, ...partial }

    partial = await this.stage(proposalId, "validate", () => this.doValidate(state!, proposalId))
    if (!partial) return this.done(proposalId, "rejected")
    state = { ...state, ...partial }

    partial = await this.stage(proposalId, "analyze", () => this.doAnalyze(state!))
    if (!partial) return this.done(proposalId, "error")
    state = { ...state, ...partial }

    partial = await this.stage(proposalId, "plan", () => this.doPlan(state!, proposalId))
    if (!partial) return this.done(proposalId, "reviewing")
    state = { ...state, ...partial }

    partial = await this.stage(proposalId, "build", () => this.doBuild(state!, proposalId))
    if (!partial) return this.done(proposalId, "error")

    logger.info("Pipeline completed", {
      proposalId,
      projectId: this.projectId,
      traceId: this.traceId,
      duration: Date.now() - now,
      status: "ok",
      stage: "build",
    })

    return this.done(proposalId, "merged")
  }

  get stageResults(): ReadonlyArray<StageResult> {
    return [...this.stages]
  }

  private async stage(
    proposalId: string,
    name: StageName,
    fn: () => Promise<StageResultWithState | null> | StageResultWithState | null
  ): Promise<BuildState | null> {
    const start = Date.now()
    try {
      logger.info(`Pipeline stage ${name} started`, {
        proposalId,
        projectId: this.projectId,
        traceId: this.traceId,
        stage: name,
      })

      const result = await fn()
      const elapsedMs = Date.now() - start

      if (!result) {
        this.stages.push({
          stage: name, ok: false, skipped: false,
          elapsedMs,
        })

        const lastFailed = this.stages.filter((s) => !s.ok).pop()
        const errorCode = lastFailed ? `STAGE_${lastFailed.stage.toUpperCase()}_FAILED` : undefined

        metrics.recordStage(name, false, elapsedMs, errorCode)

        logger.error(`Pipeline stage ${name} failed`, {
          proposalId,
          projectId: this.projectId,
          traceId: this.traceId,
          stage: name,
          duration: elapsedMs,
          status: "failed",
          errorCode,
        })

        return null
      }

      this.stages.push({
        stage: name, ok: true, skipped: false,
        elapsedMs,
      })

      metrics.recordStage(name, true, elapsedMs)

      logger.info(`Pipeline stage ${name} completed`, {
        proposalId,
        projectId: this.projectId,
        traceId: this.traceId,
        stage: name,
        duration: elapsedMs,
        status: "ok",
      })

      return result.state as BuildState
    } catch (err) {
      const elapsedMs = Date.now() - start
      const errorCode = err instanceof Error ? err.message : String(err)

      this.stages.push({
        stage: name, ok: false, skipped: false,
        error: errorCode,
        elapsedMs,
      })

      metrics.recordStage(name, false, elapsedMs, errorCode)

      logger.error(`Pipeline stage ${name} error`, {
        proposalId,
        projectId: this.projectId,
        traceId: this.traceId,
        stage: name,
        duration: elapsedMs,
        status: "failed",
        errorCode,
      })

      return null
    }
  }

  private async doIntake(proposalId: string): Promise<StageResultWithState | null> {
    const { proposal, error: err } = await loadProposal(this.supabase, proposalId)
    if (err || !proposal) return null
    if (proposal.build_status !== "pending") return null

    // Pre-filter with Sarvam
    const observation = `Summary: ${proposal.summary || ''}\nDecisions: ${JSON.stringify(proposal.decisions || [])}\nFiles: ${JSON.stringify(proposal.files_modified || [])}\nAPIs: ${JSON.stringify(proposal.apis_affected || [])}\nDB changes: ${JSON.stringify(proposal.db_changes || [])}`
    const classification = await classifyObservation(observation)

    if (!classification.promote) {
      this.outcomeOverride = "rejected"
      await this.supabase
        .from("knowledge_proposals")
        .update({
          build_status: "rejected",
          review_notes: `Ignored: ${classification.reason}`
        })
        .eq("id", proposalId)

      await this.supabase
        .from("ai_timeline_events")
        .insert({
          project_id: proposal.project_id,
          agent_id: proposal.agent_id,
          event_type: "proposal_rejected",
          title: `Ignored proposal: ${proposal.summary?.substring(0, 50)}`,
          details: { proposal_id: proposalId, reason: classification.reason }
        })

      return null
    }

    const result = validateProposalStructure(proposal)
    if (!result.valid) {
      const messages = result.errors.map(
        (e) => `[${e.code}] ${e.field}: ${e.message}`
      )
      await rejectProposal(this.supabase, proposal, proposalId, messages)
      return null
    }

    return {
      state: {
        proposal,
        evidence: { score: 0, details: { factors: {} as any, weights: {}, reasons: [] } },
        entries: []
      }
    }
  }

  private async doVerify(proposal: KnowledgeProposal): Promise<StageResultWithState | null> {
    const source = createDefaultEvidenceSource(
      isLikelyCommitSha(proposal.commit_sha),
      proposal.tests_passed === true,
      proposal.human_reviewed === true,
      !!proposal.branch,
      Array.isArray(proposal.files_modified) && proposal.files_modified.length > 0
    )
    const result = verifyProposal(proposal, source)
    
    // Non-blocking fallback: if score is less than 50, fall back to 50
    const finalScore = result.score >= 50 ? result.score : 50
    return { state: { evidence: sourceToEvidenceResult(finalScore, source) } }
  }

  private async doValidate(
    state: BuildState,
    proposalId: string
  ): Promise<StageResultWithState | null> {
    const entries = proposalEntries(state.proposal)
    const errors = validateProposal(state.proposal, entries)
    if (errors.length > 0) {
      await rejectProposal(this.supabase, state.proposal, proposalId, errors)
      return null
    }
    return { state: { entries } }
  }

  private async doAnalyze(state: BuildState): Promise<StageResultWithState | null> {
    // Load existing active brain entries for this project
    const query = this.supabase
      .from("brain_entries")
      .select("*")
      .eq("project_id", state.proposal.project_id)
      .eq("status", "active")
    const { data: existing } = (await query) as any
    const activeEntries = existing || []

    const analysis = analyzeKnowledge(state.entries, activeEntries)

    return { state: { analysis } }
  }

  private async doPlan(
    state: BuildState,
    proposalId: string
  ): Promise<StageResultWithState | null> {
    const entryInputs: MergePlanEntryInput[] = state.entries.map((e) => ({
      category: e.category,
      title: e.title,
      content: e.content,
    }))

    const mergePlan = buildMergePlan(
      proposalId,
      entryInputs,
      state.analysis!,
      { evidenceScore: state.evidence.score }
    )

    await persistProposalAnalysis(
      this.supabase, proposalId, state.evidence, mergePlan, []
    )
    if (mergePlan.action === "review") {
      await markReviewing(
        this.supabase, state.proposal, proposalId,
        [], state.evidence, mergePlan
      )
      return null
    }
    return { state: { mergePlan } }
  }

  private async doBuild(
    state: BuildState,
    proposalId: string
  ): Promise<StageResultWithState | null> {
    const repository = new SupabaseBrainRepository(this.supabase)
    const publisher = new BrainPublisher(repository)
    const result = await publisher.publish(
      proposalId,
      state.proposal,
      state.mergePlan!,
      state.evidence
    )
    if (!result.ok) return null
    
    // Async trigger staleness check (fire and forget)
    if (result.version && state.mergePlan!.entries_to_add.length > 0) {
      const analyzer = new StalenessAnalyzer(this.supabase)
      analyzer.analyze({
        projectId: state.proposal.project_id,
        newVersion: result.version,
        newEntries: state.mergePlan!.entries_to_add.map(e => ({
          id: "",
          category: e.category,
          title: e.title,
          content: e.proposed_content
        }))
      }).catch(err => {
        logger.error("Failed to run async staleness analysis", { meta: { error: String(err) } })
      })
    }
    
    return { state: {} }
  }

  private done(proposalId: string, outcome: PipelineOutcome): PipelineResult {
    const lastFailed = this.stages.filter((s) => !s.ok).pop()

    const result: PipelineResult = {
      ok: outcome === "merged",
      proposalId,
      outcome,
      stages: [...this.stages],
      traceId: this.traceId,
      error: outcome === "rejected" || outcome === "error"
        ? lastFailed?.error || outcome
        : undefined,
      errorCode: lastFailed ? `STAGE_${lastFailed.stage.toUpperCase()}_FAILED` : undefined,
      retryable: outcome === "error" && lastFailed?.stage === "build",
    }

    logger.info("Pipeline finished", {
      proposalId,
      projectId: this.projectId,
      traceId: this.traceId,
      duration: this.stages.reduce((sum, s) => sum + s.elapsedMs, 0),
      status: outcome === "merged" ? "ok" : "failed",
      errorCode: result.errorCode,
      meta: { outcome, stagesCompleted: this.stages.length },
    })

    return result
  }
}
