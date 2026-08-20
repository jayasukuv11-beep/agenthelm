import { callSarvamJson } from "./sarvam-client"

export interface RelevanceScore {
  entry_id: string
  semantic_score: number // 0 to 100
  relevance_reason: string
}

export interface ReRankResult {
  rankings: RelevanceScore[]
}

const rerankSchema = {
  name: "context_semantic_rerank",
  schema: {
    type: "object",
    properties: {
      rankings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            entry_id: { type: "string" },
            semantic_score: { type: "number", description: "Relevance score between 0 and 100" },
            relevance_reason: { type: "string", description: "Why this knowledge is relevant to the task" }
          },
          required: ["entry_id", "semantic_score", "relevance_reason"],
          additionalProperties: false
        }
      }
    },
    required: ["rankings"],
    additionalProperties: false
  }
}

export async function semanticReRank(
  taskHint: string,
  entries: Array<{ id: string; category: string; title: string; content: any }>
): Promise<RelevanceScore[] | null> {
  if (!taskHint || entries.length === 0) return null

  const candidates = entries.slice(0, 20).map(e => ({
    id: e.id,
    category: e.category,
    title: e.title,
    content_preview: typeof e.content === "object" ? JSON.stringify(e.content).slice(0, 250) : String(e.content).slice(0, 250)
  }))

  const prompt = `Task Hint: "${taskHint}"

Candidate Knowledge Entries:
${JSON.stringify(candidates, null, 2)}

Score the semantic relevance of each candidate entry to the given task hint on a scale of 0 to 100.`

  const result = await callSarvamJson<ReRankResult>(
    [
      {
        role: "system",
        content: "You are the Semantic Context Re-ranker for AgentHelm's Brain Context Engine. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    rerankSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "low",
      timeoutMs: 5000
    }
  )

  return result?.rankings || null
}
