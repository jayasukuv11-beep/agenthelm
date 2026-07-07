import { describe, it, expect, vi, beforeEach } from "vitest"
import { checkSystemHealth, getReadyStatus, getLivenessStatus } from "../health"
import type { SupabaseClient } from "@supabase/supabase-js"

function createMockSupabase(overrides: {
  dbError?: Error | null
  dbData?: unknown
} = {}): SupabaseClient {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    head: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn(),
  }

  // Make the chain thenable
  mockChain.then = vi.fn((onFulfilled) => {
    if (overrides.dbError) {
      return Promise.resolve({ data: null, error: overrides.dbError }).then(onFulfilled)
    }
    return Promise.resolve({ data: overrides.dbData ?? null, error: null }).then(onFulfilled)
  })

  return {
    from: vi.fn().mockReturnValue(mockChain),
  } as unknown as SupabaseClient
}

describe("Health Checks", () => {
  describe("checkSystemHealth", () => {
    it("returns healthy when database check passes", async () => {
      const supabase = createMockSupabase({ dbError: null })
      const health = await checkSystemHealth(supabase)

      expect(health.status).toBe("healthy")
      expect(health.checks.database.ok).toBe(true)
      expect(health.timestamp).toBeDefined()
      expect(health.uptime).toBeGreaterThanOrEqual(0)
    })

    it("returns unhealthy when database check fails", async () => {
      const supabase = createMockSupabase({
        dbError: new Error("Connection refused"),
      })
      const health = await checkSystemHealth(supabase)

      expect(health.status).toBe("unhealthy")
      expect(health.checks.database.ok).toBe(false)
      expect(health.checks.database.message).toBe("Connection refused")
    })

    it("returns unhealthy when query throws", async () => {
      const supabase = {
        from: vi.fn(() => {
          throw new Error("Unexpected error")
        }),
      } as unknown as SupabaseClient

      const health = await checkSystemHealth(supabase)

      expect(health.status).toBe("unhealthy")
      expect(health.checks.database.ok).toBe(false)
      expect(health.checks.database.message).toContain("Unexpected error")
    })
  })

  describe("getReadyStatus", () => {
    it("returns healthy when all checks pass", () => {
      const health = {
        status: "healthy" as const,
        checks: { database: { ok: true }, cache: { ok: true } },
        timestamp: new Date().toISOString(),
        uptime: 100,
      }

      const ready = getReadyStatus(health)

      expect(ready.status).toBe("healthy")
      expect(ready.checks).toEqual(health.checks)
    })

    it("returns unhealthy when any check fails", () => {
      const health = {
        status: "healthy" as const,
        checks: { database: { ok: true }, cache: { ok: false, message: "Cache down" } },
        timestamp: new Date().toISOString(),
        uptime: 100,
      }

      const ready = getReadyStatus(health)

      expect(ready.status).toBe("unhealthy")
    })
  })

  describe("getLivenessStatus", () => {
    it("always returns healthy with process check", () => {
      const live = getLivenessStatus()

      expect(live.status).toBe("healthy")
      expect(live.checks.process.ok).toBe(true)
      expect(live.checks.process.message).toBe("Process is running")
      expect(live.timestamp).toBeDefined()
      expect(live.uptime).toBeGreaterThanOrEqual(0)
    })
  })
})