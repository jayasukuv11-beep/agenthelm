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
import { classifyProposal, SarvamClassification } from "./providers/sarvam-classify"
import { evaluatePolicy, ProjectPolicyConfig } from "./policy-engine"
import { assessEvidenceQuality } from "./providers/sarvam-evidence"

export type StageName =
  | "intake"
  | "policy"
  | "classify"
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
  sarvam_used?: boolean
  fallback_used?: boolean
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
  policyConfig?: ProjectPolicyConfig | null
  classification?: SarvamClassification
  evidence: EvidenceResult
  entries: Array<{ category: BrainCategory; title: string; content: JsonRecord }>
  analysis?: AnalysisResult
  mergePlan?: MergePlan
}

type StageResultWithState = {
  state: Partial<BuildState>
  sarvam_used?: boolean
  fallback_used?: boolean
}

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

    // Stage 1: Intake (Load & Structure check)
    let state = await this.stage(proposalId, "intake", () => this.doIntake(proposalId))
    if (!state) {
      return this.done(proposalId, this.outcomeOverride || "error")
    }
    if (state.proposal) {
      this.projectId = state.proposal.project_id
    }

    // Stage 2: Policy Engine
    let partial = await this.stage(proposalId, "policy", () => this.doPolicy(state!, proposalId))
    if (!partial) {
      return this.done(proposalId, this.outcomeOverride || "rejected")
    }
    state = { ...state, ...partial }

    // Stage 3: Rich Sarvam Classification
    partial = await this.stage(proposalId, "classify", () => this.doClassify(state!, proposalId))
    if (!partial) return this.done(proposalId, "error")
    state = { ...state, ...partial }

    // Stage 4: Verify (Deterministic scoring + Sarvam evidence quality assessment)
    partial = await this.stage(proposalId, "verify", () => this.doVerify(state!))
    if (!partial) return this.done(proposalId, "error")
    state = { ...state, ...partial }

    // Stage 5: Validate
    partial = await this.stage(proposalId, "validate", () => this.doValidate(state!, proposalId))
    if (!partial) return this.done(proposalId, "rejected")
    state = { ...state, ...partial }

    // Stage 6: Analyze (Async Semantic Conflict & Cross-Category Dependency Detection)
    partial = await this.stage(proposalId, "analyze", () => this.doAnalyze(state!))
    if (!partial) return this.done(proposalId, "error")
    state = { ...state, ...partial }

    // Stage 7: Plan
    partial = await this.stage(proposalId, "plan", () => this.doPlan(state!, proposalId))
    if (!partial) return this.done(proposalId, "reviewing")
    state = { ...state, ...partial }

    // Stage 8: Build (Publish version & trigger staleness analysis)
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
        const isReviewing = this.outcomeOverride === "reviewing"
        this.stages.push({
          stage: name,
          ok: isReviewing,
          skipped: false,
          sarvam_used: false,
          fallback_used: false,
          elapsedMs,
        })

        if (!isReviewing) {
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
        }

        return null
      }

      this.stages.push({
        stage: name,
        ok: true,
        skipped: false,
        sarvam_used: result.sarvam_used ?? false,
        fallback_used: result.fallback_used ?? false,
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
        stage: name,
        ok: false,
        skipped: false,
        sarvam_used: false,
        fallback_used: false,
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

  // 1. Intake
  private async doIntake(proposalId: string): Promise<StageResultWithState | null> {
    const { proposal, error: err } = await loadProposal(this.supabase, proposalId)
    if (err || !proposal) return null
    if (proposal.build_status !== "pending") return null

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

  // 2. Policy Engine
  private async doPolicy(state: BuildState, proposalId: string): Promise<StageResultWithState | null> {
    const { data: policyRecord } = await this.supabase
      .from("project_policies")
      .select("*")
      .eq("project_id", state.proposal.project_id)
      .maybeSingle()

    const config: ProjectPolicyConfig | null = policyRecord || { mode: "gated" }
    const policyResult = evaluatePolicy(state.proposal, config, state.proposal.evidence_score || 0)

    // Audit log (fire-and-forget)
    void this.supabase
      .from("policy_audit_log")
      .insert({
        project_id: state.proposal.project_id,
        proposal_id: proposalId,
        agent_id: state.proposal.agent_id || null,
        decision: policyResult.decision,
        rules_matched: policyResult.rules_matched,
        mode: policyResult.mode,
        reason: policyResult.reason,
        evidence_score: state.proposal.evidence_score || 0,
        elapsed_ms: policyResult.elapsed_ms
      })

    if (policyResult.decision === "reject") {
      this.outcomeOverride = "rejected"
      await this.supabase
        .from("knowledge_proposals")
        .update({
          build_status: "rejected",
          review_notes: `Policy Rejected: ${policyResult.reason}`
        })
        .eq("id", proposalId)

      await this.supabase
        .from("ai_timeline_events")
        .insert({
          project_id: state.proposal.project_id,
          agent_id: state.proposal.agent_id,
          event_type: "proposal_rejected",
          title: `Policy Rejected: ${state.proposal.summary?.substring(0, 50)}`,
          details: { proposal_id: proposalId, reason: policyResult.reason, rules: policyResult.rules_matched }
        })

      return null
    }

    return {
      state: { policyConfig: config }
    }
  }

  // 3. Classify (Sarvam-105B)
  private async doClassify(state: BuildState, proposalId: string): Promise<StageResultWithState | null> {
    const classification = await classifyProposal(state.proposal)
    const isFallback = classification.reason.startsWith("Deterministic fallback")

    // Store rich classification on proposal (fire-and-forget)
    void this.supabase
      .from("knowledge_proposals")
      .update({
        sarvam_category: classification.category,
        sarvam_risk_level: classification.risk_level,
        sarvam_confidence: classification.confidence,
        sarvam_summary: classification.summary_for_brain,
        semantic_tags: classification.semantic_tags
      })
      .eq("id", proposalId)

    return {
      state: { classification },
      sarvam_used: !isFallback,
      fallback_used: isFallback
    }
  }

  // 4. Verify
  private async doVerify(state: BuildState): Promise<StageResultWithState | null> {
    const { proposal } = state
    const source = createDefaultEvidenceSource(
      isLikelyCommitSha(proposal.commit_sha),
      proposal.tests_passed === true,
      proposal.human_reviewed === true,
      !!proposal.branch,
      Array.isArray(proposal.files_modified) && proposal.files_modified.length > 0
    )
    const result = verifyProposal(proposal, source)
    let finalScore = result.score

    // Enrich with Sarvam qualitative evidence assessment
    let sarvamUsed = false
    try {
      const assessment = await assessEvidenceQuality(proposal, finalScore)
      if (assessment && typeof assessment.quality_score === "number") {
        sarvamUsed = true
        // Blend: 50% deterministic score + 50% qualitative score
        finalScore = Math.round(0.5 * finalScore + 0.5 * assessment.quality_score)
      }
    } catch {
      // Fallback to deterministic score
    }

    return {
      state: { evidence: sourceToEvidenceResult(finalScore, source) },
      sarvam_used: sarvamUsed,
      fallback_used: !sarvamUsed
    }
  }

  // 5. Validate
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

  // 6. Analyze
  private async doAnalyze(state: BuildState): Promise<StageResultWithState | null> {
    const query = this.supabase
      .from("brain_entries")
      .select("*")
      .eq("project_id", state.proposal.project_id)
      .eq("status", "active")
    const { data: existing } = (await query) as any
    const activeEntries = existing || []

    const analysis = await analyzeKnowledge(state.entries, activeEntries)

    return { state: { analysis } }
  }

  // 7. Plan
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
      {
        evidenceScore: state.evidence.score,
        humanReviewed: state.proposal.human_reviewed === true
      }
    )

    await persistProposalAnalysis(
      this.supabase, proposalId, state.evidence, mergePlan, []
    )
    if (mergePlan.action === "review") {
      this.outcomeOverride = "reviewing"
      await markReviewing(
        this.supabase, state.proposal, proposalId,
        [], state.evidence, mergePlan
      )
      return null
    }
    return { state: { mergePlan } }
  }

  // 8. Build
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
    if (!result.ok) {
      if (result.errorCode === "ALREADY_PUBLISHED") {
        const latestVersion = await repository.getLatestVersion(state.proposal.project_id)
        if (latestVersion !== null) {
          await repository.markProposalMerged(proposalId, latestVersion)
        }
        return { state: {} }
      }
      const detail = result.errors?.[0] || result.errorCode || "Publish failed"
      throw new Error(`[${result.errorCode || "PUBLISH_FAILED"}] ${detail}`)
    }
    
    // Fire-and-forget async staleness check
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

    let error: string | undefined
    if (outcome === "rejected" || outcome === "error") {
      if (lastFailed?.error) {
        error = lastFailed.error
      } else if (lastFailed) {
        error = `Stage '${lastFailed.stage}' failed without a specific error (outcome: ${outcome})`
      } else {
        error = outcome
      }
    }

    const result: PipelineResult = {
      ok: outcome === "merged",
      proposalId,
      outcome,
      stages: [...this.stages],
      traceId: this.traceId,
      error,
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
