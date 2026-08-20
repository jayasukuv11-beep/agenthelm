import { callSarvamJson } from "./sarvam-client"

export interface ExtractedKnowledgeEntity {
  summary: string
  category: "architecture" | "decisions" | "apis" | "database" | "standards" | "infrastructure" | "notes"
  key_facts: string[]
  dependencies: string[]
  risk_level: "low" | "medium" | "high"
}

export interface ExtractionResult {
  entities: ExtractedKnowledgeEntity[]
}

const extractionSchema = {
  name: "knowledge_extraction",
  schema: {
    type: "object",
    properties: {
      entities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            summary: { type: "string", description: "One-line distillation of the knowledge fact or decision" },
            category: {
              type: "string",
              enum: ["architecture", "decisions", "apis", "database", "standards", "infrastructure", "notes"]
            },
            key_facts: {
              type: "array",
              items: { type: "string" },
              description: "Specific technical details, endpoints, tables, or parameters"
            },
            dependencies: {
              type: "array",
              items: { type: "string" },
              description: "Related components or dependencies"
            },
            risk_level: {
              type: "string",
              enum: ["low", "medium", "high"]
            }
          },
          required: ["summary", "category", "key_facts", "dependencies", "risk_level"],
          additionalProperties: false
        }
      }
    },
    required: ["entities"],
    additionalProperties: false
  }
}

export function fallbackExtraction(filename: string, content: string): ExtractedKnowledgeEntity[] {
  const lowerName = filename.toLowerCase()
  let category: "architecture" | "decisions" | "apis" | "database" | "standards" | "infrastructure" | "notes" = "notes"

  if (lowerName.includes("readme")) category = "architecture"
  else if (lowerName.includes("openapi") || lowerName.includes("swagger")) category = "apis"
  else if (lowerName.includes("schema") || lowerName.endsWith(".sql") || lowerName.includes("prisma")) category = "database"
  else if (lowerName.includes("cursorrules") || lowerName.includes("claude.md") || lowerName.includes("agents.md")) category = "standards"
  else if (lowerName.includes("docker") || lowerName.includes("compose")) category = "infrastructure"

  // Basic regex extraction of headings or table definitions
  const lines = content.split("\n").filter(l => l.trim().length > 0)
  const headings = lines.filter(l => l.startsWith("#") || l.toUpperCase().includes("CREATE TABLE"))

  const entities: ExtractedKnowledgeEntity[] = []

  if (headings.length > 0) {
    for (const h of headings.slice(0, 5)) {
      entities.push({
        summary: `Imported from ${filename}: ${h.replace(/^#+\s*/, '').trim()}`,
        category,
        key_facts: [`Source file: ${filename}`],
        dependencies: [],
        risk_level: category === "database" ? "high" : "low"
      })
    }
  } else {
    entities.push({
      summary: `Imported knowledge from ${filename}`,
      category,
      key_facts: [`Source file: ${filename}`],
      dependencies: [],
      risk_level: "low"
    })
  }

  return entities
}

export async function extractKnowledgeFromFile(
  filename: string,
  content: string
): Promise<ExtractedKnowledgeEntity[]> {
  const truncatedContent = content.slice(0, 15000)

  const prompt = `Extract all structured project knowledge entities from this codebase file:

Filename: ${filename}
Content:
\`\`\`
${truncatedContent}
\`\`\`

Identify architecture conventions, database models, API contracts, infrastructure rules, and engineering decisions.`

  const result = await callSarvamJson<ExtractionResult>(
    [
      {
        role: "system",
        content: "You are the Repository Knowledge Extractor for AgentHelm. Extract concise, accurate project brain entries. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    extractionSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "medium",
      timeoutMs: 5000
    }
  )

  if (!result || !result.entities || result.entities.length === 0) {
    return fallbackExtraction(filename, content)
  }

  return result.entities
}
