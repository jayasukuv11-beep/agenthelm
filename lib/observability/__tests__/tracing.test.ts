import { describe, it, expect } from "vitest"
import { generateTraceId } from "../tracing"

describe("Tracing", () => {
  it("generates a UUID-like trace ID", () => {
    const traceId = generateTraceId()
    expect(traceId).toBeDefined()
    expect(typeof traceId).toBe("string")
    expect(traceId.length).toBeGreaterThan(0)
  })

  it("generates unique trace IDs", () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateTraceId())
    }
    expect(ids.size).toBe(100)
  })

  it("generates valid UUID format (version 4)", () => {
    const traceId = generateTraceId()
    // Check for UUID format: 8-4-4-4-12 hex chars
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(traceId).toMatch(uuidRegex)
  })

  it("does not throw in restricted environments", () => {
    // This should not throw even if crypto is unavailable
    // (though in Node.js it's always available)
    expect(() => generateTraceId()).not.toThrow()
  })
})