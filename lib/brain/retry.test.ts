import { describe, it, expect } from "vitest"
import { retryWithBackoff, isTransientError } from "./retry"

describe("isTransientError", () => {
  it("returns true for timeout", () => {
    expect(isTransientError(new Error("Connection timeout"))).toBe(true)
  })

  it("returns true for ECONNRESET", () => {
    expect(isTransientError(new Error("ECONNRESET: connection was reset"))).toBe(true)
  })

  it("returns true for 503", () => {
    expect(isTransientError(new Error("503 Service Unavailable"))).toBe(true)
  })

  it("returns true for 504", () => {
    expect(isTransientError(new Error("504 Gateway Timeout"))).toBe(true)
  })

  it("returns true for network", () => {
    expect(isTransientError(new Error("Network connection refused"))).toBe(true)
  })

  it("returns false for validation error", () => {
    expect(isTransientError(new Error("validation error: invalid field"))).toBe(false)
  })

  it("returns false for conflict", () => {
    expect(isTransientError(new Error("conflict detected"))).toBe(false)
  })

  it("returns false for duplicate", () => {
    expect(isTransientError(new Error("already published"))).toBe(false)
  })

  it("returns false for non-transient error string", () => {
    expect(isTransientError("Something went wrong")).toBe(false)
  })
})

describe("retryWithBackoff", () => {
  it("returns data immediately on success", async () => {
    const result = await retryWithBackoff(async () => "success")
    expect(result.ok).toBe(true)
    expect(result.data).toBe("success")
    expect(result.attempts).toBe(1)
  })

  it("retries on transient errors", async () => {
    let attempts = 0
    const result = await retryWithBackoff(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error("Connection timeout")
      }
      return "recovered"
    })

    expect(result.ok).toBe(true)
    expect(result.data).toBe("recovered")
    expect(attempts).toBe(3)
  })

  it("gives up after max attempts on transient errors", async () => {
    let attempts = 0
    const result = await retryWithBackoff(
      async () => {
        attempts++
        throw new Error("Connection timeout")
      },
      { maxAttempts: 2 }
    )

    expect(result.ok).toBe(false)
    expect(result.attempts).toBe(2)
  })

  it("does NOT retry non-transient errors", async () => {
    let attempts = 0
    const result = await retryWithBackoff(async () => {
      attempts++
      throw new Error("validation error: field required")
    })

    expect(result.ok).toBe(false)
    expect(result.attempts).toBe(1)
  })

  it("respects custom maxAttempts", async () => {
    let attempts = 0
    const result = await retryWithBackoff(
      async () => {
        attempts++
        throw new Error("503 Service Unavailable")
      },
      { maxAttempts: 5 }
    )

    expect(result.ok).toBe(false)
    expect(result.attempts).toBe(5)
  })

  it("propagates the original error message", async () => {
    const result = await retryWithBackoff(async () => {
      throw new Error("Connection timeout")
    }, { maxAttempts: 2 })

    expect(result.ok).toBe(false)
    expect(result.error?.message).toContain("Connection timeout")
  })
})
