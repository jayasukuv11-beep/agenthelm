import { callSarvamJson } from "./sarvam-client"

export interface DependencyItem {
  entry_id: string
  relationship: string
  impact: "breaking" | "non_breaking" | "informational"
  should_mark_stale: boolean
}

export interface DependencyAnalysis {
  dependencies: DependencyItem[]
}

const dependenciesSchema = {
  name: "dependency_analysis",
  schema: {
    type: "object",
    properties: {
      dependencies: {
        type: "array",
        items: {
          type: "object",
          properties: {
            entry_id: { type: "string" },
            relationship: { type: "string", description: "How the proposed entry affects this existing entry" },
            impact: {
              type: "string",
              enum: ["breaking", "non_breaking", "informational"],
              description: "Severity of the impact"
            },
            should_mark_stale: { type: "boolean", description: "Whether the existing entry is rendered stale/needs review" }
          },
          required: ["entry_id", "relationship", "impact", "should_mark_stale"],
          additionalProperties: false
        }
      }
    },
    required: ["dependencies"],
    additionalProperties: false
  }
}

export async function analyzeDependencies(
  newEntry: { category: string; title: string; content: any },
  existingEntries: Array<{ id: string; category: string; title: string; content: any }>
): Promise<DependencyAnalysis | null> {
  if (existingEntries.length === 0) {
    return { dependencies: [] }
  }

  // Cap candidates to 50 entries
  const candidateBatch = existingEntries.slice(0, 50).map(e => ({
    id: e.id,
    category: e.category,
    title: e.title,
    content_summary: typeof e.content === "object" ? JSON.stringify(e.content).slice(0, 200) : String(e.content).slice(0, 200)
  }))

  const prompt = `Identify cross-category dependencies between this new proposed knowledge entry and existing project knowledge:

[NEW KNOWLEDGE ENTRY]
Category: ${newEntry.category}
Title: ${newEntry.title}
Content: ${JSON.stringify(newEntry.content)}

[EXISTING BRAIN ENTRIES (Top candidates)]
${JSON.stringify(candidateBatch, null, 2)}

Find which existing entries are impacted by, depend on, or invalidated by the new entry.`

  const result = await callSarvamJson<DependencyAnalysis>(
    [
      {
        role: "system",
        content: "You are the Cross-Category Dependency Mapper for AgentHelm's Brain Compiler. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    dependenciesSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "low",
      timeoutMs: 5000
    }
  )

  return result
}
