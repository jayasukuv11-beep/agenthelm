import { describe, it, expect, vi, beforeEach } from "vitest"
import { classifyObservation } from "../lib/brain/providers/sarvam-promotion"

describe("Sarvam Promotion Classification Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("SARVAM_API_KEY", "mock-sarvam-key-12345")
  })

  it("returns promote: true when Sarvam approves observation", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({ promote: true, reason: "Observation contains DB schema changes" })
          }
        }
      ]
    }

    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any)

    const result = await classifyObservation("Decided to add table users")

    expect(fetchSpy).toHaveBeenCalledWith("https://api.sarvam.ai/v1/chat/completions", expect.any(Object))
    
    // Check request body parameters
    const requestBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(requestBody.model).toBe("sarvam-30b")
    expect(requestBody.reasoning_effort).toBeNull()

    expect(result.promote).toBe(true)
    expect(result.reason).toBe("Observation contains DB schema changes")
  })

  it("returns promote: false when Sarvam ignores observation", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({ promote: false, reason: "Observation is routine noise: print statement" })
          }
        }
      ]
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any)

    const result = await classifyObservation("print('hello world')")

    expect(result.promote).toBe(false)
    expect(result.reason).toBe("Observation is routine noise: print statement")
  })

  it("falls back to promote: true when API returns non-200 status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error")
    } as any)

    const result = await classifyObservation("Something happened")

    expect(result.promote).toBe(true)
    expect(result.reason).toBe("fallback: sarvam unavailable")
  })

  it("falls back to promote: true when fetch throws a network exception", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network connection lost"))

    const result = await classifyObservation("Something happened")

    expect(result.promote).toBe(true)
    expect(result.reason).toBe("fallback: sarvam unavailable")
  })

  it("falls back to promote: true when API returns malformed JSON", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "This is not JSON at all!"
          }
        }
      ]
    }

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as any)

    const result = await classifyObservation("Something happened")

    expect(result.promote).toBe(true)
    expect(result.reason).toBe("fallback: sarvam unavailable")
  })

  it("falls back to promote: true when SARVAM_API_KEY is not set", async () => {
    vi.stubEnv("SARVAM_API_KEY", "")

    const result = await classifyObservation("Something happened")

    expect(result.promote).toBe(true)
    expect(result.reason).toBe("fallback: sarvam apiKey missing")
  })
})
