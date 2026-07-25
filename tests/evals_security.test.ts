import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST as postResults } from "../app/api/sdk/evals/results/route"
import { POST as postRegression, GET as getRegression, PATCH as patchRegression } from "../app/api/sdk/evals/regression/route"
import { POST as postFromTrace } from "../app/api/sdk/evals/from-trace/route"
import { validateConnectKey, ownsAgent } from "../lib/sdk-auth"

vi.mock("../lib/sdk-auth", () => {
  return {
    validateConnectKey: vi.fn(),
    ownsAgent: vi.fn()
  }
})

// agent-123, task-123 and set-123 all belong to user-b
const OWNER = "user-b"

describe("API Security - Evals Routes", () => {
  let mockSupabaseAdmin: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabaseAdmin = {
      from: vi.fn().mockImplementation((table) => {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
        }

        const row = () => {
          if (table === "agent_eval_sets") return { id: "set-123", agent_id: "agent-123" }
          if (table === "eval_regressions") return { id: "reg-123", agent_id: "agent-123" }
          if (table === "agent_tasks") return { id: "task-123", user_id: OWNER }
          return null
        }

        chain.maybeSingle = vi.fn(() => Promise.resolve({ data: row(), error: null }))
        chain.single = vi.fn(() => Promise.resolve({ data: row(), error: null }))
        chain.then = vi.fn((onFulfilled) =>
          Promise.resolve({ data: [], error: null }).then(onFulfilled)
        )

        return chain
      })
    }
  })

  function authAs(userId: string, plan = "studio") {
    vi.mocked(validateConnectKey).mockResolvedValue({
      userId,
      plan,
      supabaseAdmin: mockSupabaseAdmin
    } as any)
    vi.mocked(ownsAgent).mockImplementation(async (_c, _agentId, uid) => uid === OWNER)
  }

  function post(url: string, body: any) {
    return new Request(url, { method: "POST", body: JSON.stringify(body) })
  }

  describe("POST /api/sdk/evals/results", () => {
    it("returns 403 if user A posts results for user B's agent", async () => {
      authAs("user-a")

      const res = await postResults(post("http://localhost/api/sdk/evals/results", {
        key: "user-a-key", agent_id: "agent-123", name: "my-eval", passed: true
      }))

      expect(res.status).toBe(403)
      expect((await res.json()).error).toBe("Unauthorized agent access")
    })

    it("returns 403 if the eval set belongs to a different agent", async () => {
      authAs(OWNER)

      const res = await postResults(post("http://localhost/api/sdk/evals/results", {
        key: "user-b-key", agent_id: "other-agent", eval_set_id: "set-123", passed: true
      }))

      expect(res.status).toBe(403)
      expect((await res.json()).error).toBe("Unauthorized eval set access")
    })
  })

  describe("POST /api/sdk/evals/regression", () => {
    it("returns 403 if user A compares versions on user B's agent", async () => {
      authAs("user-a")

      const res = await postRegression(post("http://localhost/api/sdk/evals/regression", {
        key: "user-a-key",
        agent_id: "agent-123",
        eval_set_id: "set-123",
        current_version: "2.0.0",
        baseline_version: "1.0.0"
      }))

      expect(res.status).toBe(403)
      expect((await res.json()).error).toBe("Unauthorized agent access")
    })
  })

  describe("GET /api/sdk/evals/regression", () => {
    it("returns 403 if user A reads user B's regressions", async () => {
      authAs("user-a")

      const res = await getRegression(
        new Request("http://localhost/api/sdk/evals/regression?agent_id=agent-123&key=user-a-key")
      )

      expect(res.status).toBe(403)
      expect((await res.json()).error).toBe("Unauthorized agent access")
    })

    it("returns 200 if user B reads their own regressions", async () => {
      authAs(OWNER)

      const res = await getRegression(
        new Request("http://localhost/api/sdk/evals/regression?agent_id=agent-123&key=user-b-key")
      )

      expect(res.status).toBe(200)
    })
  })

  describe("PATCH /api/sdk/evals/regression", () => {
    it("returns 403 if user A acknowledges user B's regression", async () => {
      authAs("user-a")

      const res = await patchRegression(new Request("http://localhost/api/sdk/evals/regression", {
        method: "PATCH",
        body: JSON.stringify({ key: "user-a-key", regression_id: "reg-123" })
      }))

      expect(res.status).toBe(403)
      expect((await res.json()).error).toBe("Unauthorized agent access")
    })

    it("returns 200 if user B acknowledges their own regression", async () => {
      authAs(OWNER)

      const res = await patchRegression(new Request("http://localhost/api/sdk/evals/regression", {
        method: "PATCH",
        body: JSON.stringify({ key: "user-b-key", regression_id: "reg-123" })
      }))

      expect(res.status).toBe(200)
    })
  })

  describe("POST /api/sdk/evals/from-trace", () => {
    it("returns 403 if user A builds an eval set from user B's trace", async () => {
      authAs("user-a")

      const res = await postFromTrace(post("http://localhost/api/sdk/evals/from-trace", {
        key: "user-a-key", task_id: "task-123", agent_id: "agent-123"
      }))

      expect(res.status).toBe(403)
      expect((await res.json()).error).toBe("Unauthorized agent access")
    })
  })
})
