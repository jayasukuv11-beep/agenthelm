import { callSarvamJson } from "./sarvam-client"

export type SemanticRelationType = "same" | "related" | "different" | "contradicts"
export type MergeStrategy = "supersede" | "merge" | "keep_both" | "reject"

export interface SemanticRelation {
  relation: SemanticRelationType
  confidence: number
  reason: string
  merge_strategy: MergeStrategy
}

const semanticRelationSchema = {
  name: "semantic_relation_analysis",
  schema: {
    type: "object",
    properties: {
      relation: {
        type: "string",
        enum: ["same", "related", "different", "contradicts"],
        description: "Semantic relationship between the proposed knowledge and existing knowledge"
      },
      confidence: {
        type: "number",
        description: "Confidence score between 0.0 and 1.0"
      },
      reason: {
        type: "string",
        description: "Detailed explanation of why they relate, duplicate, or conflict"
      },
      merge_strategy: {
        type: "string",
        enum: ["supersede", "merge", "keep_both", "reject"],
        description: "Recommended merge resolution strategy"
      }
    },
    required: ["relation", "confidence", "reason", "merge_strategy"],
    additionalProperties: false
  }
}

export async function analyzeSemanticRelation(
  proposedEntry: { category: string; title: string; content: any },
  existingEntry: { category: string; title: string; content: any }
): Promise<SemanticRelation | null> {
  const prompt = `Compare these two project brain knowledge entries:

[PROPOSED ENTRY]
Category: ${proposedEntry.category}
Title: ${proposedEntry.title}
Content: ${JSON.stringify(proposedEntry.content)}

[EXISTING ENTRY]
Category: ${existingEntry.category}
Title: ${existingEntry.title}
Content: ${JSON.stringify(existingEntry.content)}

Determine if they describe the exact same concept ("same"), conflicting facts ("contradicts"), complementary context ("related"), or completely distinct subjects ("different").`

  const result = await callSarvamJson<SemanticRelation>(
    [
      {
        role: "system",
        content: "You are the Semantic Relation Judge for AgentHelm's Brain Compiler. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    semanticRelationSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "low",
      timeoutMs: 5000
    }
  )

  return result
}
