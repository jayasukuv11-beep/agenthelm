import { describe, it, expect, vi } from "vitest"
import { BrainPipeline, StageName, PipelineResult } from "./pipeline"
import type { KnowledgeProposal } from "./types"
import { classifyObservation } from "./providers/sarvam-promotion"

vi.mock("./providers/sarvam-promotion", () => ({
  classifyObservation: vi.fn().mockResolvedValue({ promote: true, reason: "mocked promote" })
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeProposal(overrides: Partial<KnowledgeProposal> = {}): KnowledgeProposal {
  return {
    id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    project_id: "proj-1",
    build_status: "pending",
    summary: "Test proposal",
    decisions: [{ title: "Use Postgres" }],
    tests_passed: true,
    human_reviewed: true,
    files_modified: ["src/index.ts"],
    ...overrides
  }
}

function createMockSupabase(db: Record<string, unknown> = {}) {
  return {
    from: (table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        single: () => Promise.resolve({ data: db[table] || null, error: null }),
        insert: () => chain,
        update: () => chain,
        order: () => chain,
        limit: () => chain,
        ilike: () => chain
      }
      return chain
    },
    channel: () => {
      return {
        send: (payload: unknown) => Promise.resolve()
      }
    }
  } as any
}

function expectStagesInOrder(stages: { stage: StageName }[], expected: StageName[]) {
  const actual = stages.map((s) => s.stage)
  expect(actual).toEqual(expected)
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("BrainPipeline", () => {
  describe("intake stage", () => {
    it("returns error when proposal not found", async () => {
      const supabase = createMockSupabase({ kbwledge_proposals: null })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("nonexistent")

      expect(result.ok).toBe(false)
      expect(result.outcome).toBe("error")
      expect(result.stages).toHaveLength(1)
      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(false)
    })

    it("returns error when proposal not in pending state", async () => {
      const proposal = makeProposal({ build_status: "merged" })
      const supabase = createMockSupabase({
        knowledge_proposals: proposal
      })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expect(result.ok).toBe(false)
      expect(result.outcome).toBe("error")
      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(false)
    })

    it("passes intake for a pending proposal", async () => {
      const proposal = makeProposal()
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(true)
    })
  })

  describe("verify stage", () => {
    it("calculates evidence after intake", async () => {
      const proposal = makeProposal({
        commit_sha: "abc1234567890",
        branch: "main",
        tests_passed: true,
        human_reviewed: true,
        files_modified: ["file.ts"]
      })
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      const verifyStage = result.stages.find((s) => s.stage === "verify")
      expect(verifyStage).toBeDefined()
      expect(verifyStage?.ok).toBe(true)
      expect(result.stages[0].ok).toBe(true)
    })
  })

  describe("validate stage", () => {
    it("rejects when no entries exist", async () => {
      const proposal = makeProposal({
        decisions: [],
        apis_affected: [],
        db_changes: []
      })
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expectStagesInOrder(result.stages, ["intake", "verify", "validate"])
      expect(result.stages[2].ok).toBe(false)
      expect(result.outcome).toBe("rejected")
    })

    it("rejects at intake when payload is too large", async () => {
      const proposal = makeProposal({
        decisions: Array(100).fill({ description: "x".repeat(2000) }),
        apis_affected: [],
        db_changes: []
      })
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expect(result.stages).toHaveLength(1)
      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(false)
      expect(result.outcome).toBe("error")
    })
  })

  describe("pipeline execution", () => {
    it("records timing for each stage", async () => {
      const proposal = makeProposal()
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      for (const stage of result.stages) {
        expect(stage.elapsedMs).toBeGreaterThanOrEqual(0)
      }
    })

    it("exposes stage results via getter", async () => {
      const proposal = makeProposal()
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const _ = await pipeline.compile("prop-1")

      const results = pipeline.stageResults
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
    })

    it("includes error in failed stage", async () => {
      const dbError = "DB connection failed"
      const supabase = {
        from: () => {
          return {
            select: () => { return { eq: () => Promise.resolve({ data: null, error: dbError }) } },
          }
        },
        channel: () => ({ send: () => Promise.resolve() })
      }
      const pipeline = new BrainPipeline(supabase as any)
      const result = await pipeline.compile("prop-1")

      expect(result.stages[0].ok).toBe(false)
    })
  })

  describe("stage ordering", () => {
    it("always runs intake before all other stages", async () => {
      const proposal = makeProposal()
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      const intakeIndex = result.stages.findIndex((s) => s.stage === "intake")
      expect(intakeIndex).toBe(0)
    })

    it("stops after first failure", async () => {
      // A proposal with no entries will fail at validate stage
      const proposal = makeProposal({
        decisions: [],
        apis_affected: [],
        db_changes: []
      })
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      // Should have run: intake, verify, validate (fails)
      expect(result.stages).toHaveLength(3)
      expect(result.stages[result.stages.length - 1].ok).toBe(false)
    })
  })

  describe("Sarvam Pre-filtering", () => {
    it("continues pipeline normally when promote is true", async () => {
      vi.mocked(classifyObservation).mockResolvedValueOnce({
        promote: true,
        reason: "Important architectural change"
      })

      const proposal = makeProposal()
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(true)
      // Pipeline continues beyond intake
      expect(result.stages.length).toBeGreaterThan(1)
    })

    it("short-circuits at intake when promote is false", async () => {
      vi.mocked(classifyObservation).mockResolvedValueOnce({
        promote: false,
        reason: "Routine noise: minor readme update"
      })

      const proposal = makeProposal()
      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()
      
      const supabase = {
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { ...proposal, build_status: "pending" },
                error: null
              })
            })
          }),
          update: updateMock,
          eq: eqMock,
          insert: () => ({ eq: () => Promise.resolve() })
        }),
        channel: () => ({ send: () => Promise.resolve() })
      } as any

      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expect(result.stages).toHaveLength(1)
      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(false)
      expect(result.outcome).toBe("rejected")

      expect(updateMock).toHaveBeenCalledWith({
        build_status: "rejected",
        review_notes: "Ignored: Routine noise: minor readme update"
      })
    })

    it("falls back to promote: true when classification throws/fails", async () => {
      // Simulate classifyObservation falling back due to internal fetch error
      vi.mocked(classifyObservation).mockResolvedValueOnce({
        promote: true,
        reason: "fallback: sarvam unavailable"
      })

      const proposal = makeProposal()
      const supabase = createMockSupabase({ knowledge_proposals: proposal })
      const pipeline = new BrainPipeline(supabase)
      const result = await pipeline.compile("prop-1")

      expect(result.stages[0].stage).toBe("intake")
      expect(result.stages[0].ok).toBe(true)
      expect(result.stages.length).toBeGreaterThan(1)
    })
  })
})
