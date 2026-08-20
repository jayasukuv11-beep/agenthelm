import { callSarvamJson } from "./sarvam-client"

export interface StalenessResult {
  is_stale: boolean
  confidence: number
  reason: string
  suggested_action: "keep" | "needs_review" | "supersede"
}

const stalenessSchema = {
  name: "staleness_analysis",
  schema: {
    type: "object",
    properties: {
      is_stale: {
        type: "boolean",
        description: "True if the existing entry has been made outdated or obsolete by the new entry"
      },
      confidence: {
        type: "number",
        description: "Confidence score between 0.0 and 1.0"
      },
      reason: {
        type: "string",
        description: "Reasoning for why the existing knowledge is stale or still current"
      },
      suggested_action: {
        type: "string",
        enum: ["keep", "needs_review", "supersede"],
        description: "Action to take on the existing entry"
      }
    },
    required: ["is_stale", "confidence", "reason", "suggested_action"],
    additionalProperties: false
  }
}

export async function analyzeStaleness(
  newEntry: { category: string; title: string; content: any },
  existingEntry: { category: string; title: string; content: any }
): Promise<StalenessResult | null> {
  const prompt = `Assess whether this existing knowledge entry has been rendered stale by the newly published entry:

[NEWLY PUBLISHED ENTRY]
Category: ${newEntry.category}
Title: ${newEntry.title}
Content: ${JSON.stringify(newEntry.content)}

[EXISTING KNOWLEDGE ENTRY]
Category: ${existingEntry.category}
Title: ${existingEntry.title}
Content: ${JSON.stringify(existingEntry.content)}

Does the new change invalidate, replace, or conflict with the existing entry?`

  const result = await callSarvamJson<StalenessResult>(
    [
      {
        role: "system",
        content: "You are the Staleness & Validity Judge for AgentHelm's Brain Compiler. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    stalenessSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "low",
      timeoutMs: 5000
    }
  )

  return result
}
