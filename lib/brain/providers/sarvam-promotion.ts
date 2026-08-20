import { callSarvamJson } from "./sarvam-client"

export interface PromotionResult {
  promote: boolean
  reason: string
}

export async function classifyObservation(observation: string): Promise<PromotionResult> {
  const systemPrompt = `You are a classification system. Your job is to classify raw agent observations (decisions, changes, API impacts) as either promote-worthy (PROMOTE) or routine noise (IGNORE).

PROMOTE: Any significant architectural decision, database schema change, file modifications of critical logic, API contract additions or changes.
IGNORE: Routine noise, debugging print statements, temporary setup changes, minor readme typos, package installation.`

  const result = await callSarvamJson<PromotionResult>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: observation }
    ],
    {
      name: "observation_classification",
      schema: {
        type: "object",
        properties: {
          promote: { type: "boolean", description: "Whether the observation should be promoted to knowledge" },
          reason: { type: "string", description: "Reason for the classification" }
        },
        required: ["promote", "reason"],
        additionalProperties: false
      }
    },
    {
      model: "sarvam-105b",
      reasoningEffort: "low",
      timeoutMs: 5000
    }
  )

  if (!result || typeof result.promote !== "boolean") {
    // Fallback: default to promote = true
    return {
      promote: true,
      reason: result?.reason || "fallback: deterministic default (promote=true)"
    }
  }

  return result
}
