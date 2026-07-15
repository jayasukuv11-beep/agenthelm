import { describe, it, expect } from "vitest"

describe("sdk-auth env validation", () => {
  it("throws if secrets are missing outside production build phase", async () => {
    // Save original env
    const originalEncryptionKey = process.env.ENCRYPTION_KEY
    const originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const originalNextPhase = process.env.NEXT_PHASE

    // Set missing secrets and non-build phase
    delete process.env.ENCRYPTION_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.NEXT_PHASE = "phase-production-server"

    // Dynamic import to trigger module load validation
    await expect(import("../lib/sdk-auth?test_uncached=1")).rejects.toThrow(
      "FATAL: ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY"
    )

    // Restore env
    if (originalEncryptionKey) process.env.ENCRYPTION_KEY = originalEncryptionKey
    if (originalSupabaseKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey
    if (originalNextPhase) {
      process.env.NEXT_PHASE = originalNextPhase
    } else {
      delete process.env.NEXT_PHASE
    }
  })

  it("does NOT throw if secrets are missing during Next.js production build phase", async () => {
    // Save original env
    const originalEncryptionKey = process.env.ENCRYPTION_KEY
    const originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const originalNextPhase = process.env.NEXT_PHASE

    // Set missing secrets and build phase
    delete process.env.ENCRYPTION_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.NEXT_PHASE = "phase-production-build"

    // Dynamic import should load successfully with fallback
    const auth = await import("../lib/sdk-auth?test_uncached=2")
    expect(auth).toBeDefined()

    // Restore env
    if (originalEncryptionKey) process.env.ENCRYPTION_KEY = originalEncryptionKey
    if (originalSupabaseKey) process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey
    if (originalNextPhase) {
      process.env.NEXT_PHASE = originalNextPhase
    } else {
      delete process.env.NEXT_PHASE
    }
  })
})
