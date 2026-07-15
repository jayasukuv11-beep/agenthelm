import { logger } from "../../observability"

export interface PromotionResult {
  promote: boolean
  reason: string
}

export async function classifyObservation(observation: string): Promise<PromotionResult> {
  const apiKey = process.env.SARVAM_API_KEY

  if (!apiKey) {
    logger.warn("SARVAM_API_KEY is not set. Falling back to default PROMOTE = true.")
    return { promote: true, reason: "fallback: sarvam apiKey missing" }
  }

  try {
    const systemPrompt = `You are a classification system. Your job is to classify raw agent observations (decisions, changes, API impacts) as either promote-worthy (PROMOTE) or routine noise (IGNORE).

PROMOTE: Any significant architectural decision, database schema change, file modifications of critical logic, API contract additions or changes.
IGNORE: Routine noise, debugging print statements, temporary setup changes, minor readme typos, package installation.

You must respond in strict JSON format:
{
  "promote": boolean,
  "reason": string
}
Do not include any other text or explanation. Only return the JSON.`

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey
      },
      body: JSON.stringify({
        model: "sarvam-30b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: observation }
        ],
        reasoning_effort: null
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      logger.warn(`Sarvam API error (status ${response.status}): ${errText}. Falling back to true.`)
      return { promote: true, reason: "fallback: sarvam unavailable" }
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      logger.warn("Sarvam API returned empty completion content. Falling back to true.")
      return { promote: true, reason: "fallback: sarvam unavailable" }
    }

    // Clean markdown code blocks from response if present
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim()
    const parsed = JSON.parse(cleaned)

    if (typeof parsed.promote !== "boolean" || typeof parsed.reason !== "string") {
      logger.warn(`Sarvam API returned invalid JSON structure: ${cleaned}. Falling back to true.`)
      return { promote: true, reason: "fallback: sarvam unavailable" }
    }

    return {
      promote: parsed.promote,
      reason: parsed.reason
    }

  } catch (err: any) {
    logger.warn(`Exception during Sarvam classification: ${err.message || String(err)}. Falling back to true.`)
    return { promote: true, reason: "fallback: sarvam unavailable" }
  }
}
