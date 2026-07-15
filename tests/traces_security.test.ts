import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET as getTraces } from "../app/api/sdk/traces/route"
import { GET as getMetrics } from "../app/api/sdk/metrics/route"
import { validateConnectKey, hasError } from "../lib/sdk-auth"

// Mock the sdk-auth module
vi.mock("../lib/sdk-auth", () => {
  return {
    validateConnectKey: vi.fn(),
    hasError: vi.fn((result) => 'error' in result)
  }
})

describe("API Security - Traces and Metrics Routes", () => {
  let mockSupabaseAdmin: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Construct a mock supabase client with thenable query chain
    mockSupabaseAdmin = {
      from: vi.fn().mockImplementation((table) => {
        const queryChain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
        }

        queryChain.then = vi.fn().mockImplementation((onFulfilled) => {
          let data: any = []
          if (table === 'agent_tasks') {
            data = { id: 'task-123', user_id: 'user-b', agent_id: 'agent-123' }
          } else if (table === 'agents') {
            data = { id: 'agent-123', user_id: 'user-b' }
          }
          return Promise.resolve({ data, error: null }).then(onFulfilled)
        })

        return queryChain
      })
    }
  })

  describe("Traces API Route Authorization", () => {
    it("returns 401 if token is invalid or missing", async () => {
      vi.mocked(validateConnectKey).mockResolvedValue({ error: "Invalid key", status: 401 } as any)

      const req = new Request("http://localhost/api/sdk/traces?task_id=task-123", {
        headers: { "x-connect-key": "invalid-key" }
      })

      const res = await getTraces(req)
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe("Invalid key")
    })

    it("returns 403 if user A tries to access User B's task trace", async () => {
      // User A (authenticated) tries to request task-123 (which belongs to User B)
      vi.mocked(validateConnectKey).mockResolvedValue({
        userId: "user-a",
        supabaseAdmin: mockSupabaseAdmin
      } as any)

      const req = new Request("http://localhost/api/sdk/traces?task_id=task-123", {
        headers: { "x-connect-key": "user-a-key" }
      })

      const res = await getTraces(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe("Unauthorized task access")
    })

    it("returns 200 if user B accesses User B's task trace", async () => {
      vi.mocked(validateConnectKey).mockResolvedValue({
        userId: "user-b",
        supabaseAdmin: mockSupabaseAdmin
      } as any)

      const req = new Request("http://localhost/api/sdk/traces?task_id=task-123", {
        headers: { "x-connect-key": "user-b-key" }
      })

      const res = await getTraces(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.task).toBeDefined()
      expect(body.task.id).toBe("task-123")
    })

    it("returns 403 if user A tries to access User B's agent tasks list", async () => {
      vi.mocked(validateConnectKey).mockResolvedValue({
        userId: "user-a",
        supabaseAdmin: mockSupabaseAdmin
      } as any)

      const req = new Request("http://localhost/api/sdk/traces?agent_id=agent-123", {
        headers: { "x-connect-key": "user-a-key" }
      })

      const res = await getTraces(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe("Unauthorized agent access")
    })

    it("returns 200 if user B accesses User B's agent tasks list", async () => {
      vi.mocked(validateConnectKey).mockResolvedValue({
        userId: "user-b",
        supabaseAdmin: mockSupabaseAdmin
      } as any)

      const req = new Request("http://localhost/api/sdk/traces?agent_id=agent-123", {
        headers: { "x-connect-key": "user-b-key" }
      })

      const res = await getTraces(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.tasks).toBeDefined()
    })
  })

  describe("Metrics API Route Authorization", () => {
    it("returns 401 if token is invalid or missing", async () => {
      vi.mocked(validateConnectKey).mockResolvedValue({ error: "Invalid key", status: 401 } as any)

      const req = new Request("http://localhost/api/sdk/metrics", {
        headers: { "x-connect-key": "invalid-key" }
      })

      const res = await getMetrics(req)
      expect(res.status).toBe(401)
    })

    it("returns 200 if key is valid", async () => {
      vi.mocked(validateConnectKey).mockResolvedValue({
        userId: "user-a",
        supabaseAdmin: mockSupabaseAdmin
      } as any)

      const req = new Request("http://localhost/api/sdk/metrics", {
        headers: { "x-connect-key": "user-a-key" }
      })

      const res = await getMetrics(req)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.pipeline_metrics).toBeDefined()
    })
  })
})
