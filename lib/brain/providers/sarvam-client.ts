import { logger } from "../../observability"

export interface SarvamCallOptions {
  model?: string
  reasoningEffort?: "low" | "medium" | "high" | null
  timeoutMs?: number
}

export interface SarvamJsonSchema<T = any> {
  name: string
  strict?: boolean
  schema: Record<string, any>
}

/**
 * Shared Sarvam client supporting:
 * - 5-second AbortController timeout
 * - Sarvam-105B model default
 * - Structured JSON schema enforcement
 * - Resilient deterministic fallback (returns null on any error/timeout)
 */
export async function callSarvamJson<T = any>(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  jsonSchema: SarvamJsonSchema<T>,
  options: SarvamCallOptions = {}
): Promise<T | null> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    logger.warn("SARVAM_API_KEY is not set. Falling back to deterministic logic.")
    return null
  }

  const model = options.model ?? "sarvam-105b"
  const reasoningEffort = options.reasoningEffort ?? "low"
  const timeoutMs = process.env.NODE_ENV === "test" 
    ? Math.min(options.timeoutMs ?? 100, 100) 
    : (options.timeoutMs ?? 5000)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const payload: Record<string, any> = {
      model,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: jsonSchema.name,
          strict: jsonSchema.strict ?? true,
          schema: jsonSchema.schema
        }
      }
    }

    if (reasoningEffort !== null) {
      payload.reasoning_effort = reasoningEffort
    }

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => "")
      logger.warn(`Sarvam API error (status ${response.status}): ${errText}. Falling back.`)
      return null
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      logger.warn("Sarvam API returned empty completion content. Falling back.")
      return null
    }

    // Parse JSON directly since response_format ensures valid JSON output
    try {
      const parsed = typeof content === "string" ? JSON.parse(content) : content
      return parsed as T
    } catch (parseErr) {
      // Fallback in case there are surrounding quotes/markdown
      const cleaned = String(content).replace(/```json/g, "").replace(/```/g, "").trim()
      const fallbackParsed = JSON.parse(cleaned)
      return fallbackParsed as T
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      logger.warn(`Sarvam API call timed out after ${timeoutMs}ms. Falling back.`)
    } else {
      logger.warn(`Exception during Sarvam API call: ${err.message || String(err)}. Falling back.`)
    }
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
