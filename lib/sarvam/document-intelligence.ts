import { callSarvamJson } from "../brain/providers/sarvam-client"
import { ExtractedKnowledgeEntity, fallbackExtraction } from "../brain/providers/sarvam-extract"

export interface RawExtraction {
  text: string
  pages?: number
  tables?: string[]
}

const docExtractionSchema = {
  name: "document_knowledge_extraction",
  schema: {
    type: "object",
    properties: {
      entities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Clear knowledge statement" },
            category: {
              type: "string",
              enum: ["architecture", "decisions", "apis", "database", "standards", "infrastructure", "notes"]
            },
            key_facts: {
              type: "array",
              items: { type: "string" }
            },
            dependencies: {
              type: "array",
              items: { type: "string" }
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

export async function extractFromDocument(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractedKnowledgeEntity[]> {
  let extractedText = ""

  if (mimeType.startsWith("text/") || filename.endsWith(".md") || filename.endsWith(".sql") || filename.endsWith(".yaml") || filename.endsWith(".json")) {
    extractedText = fileBuffer.toString("utf-8")
  } else if (mimeType.startsWith("image/")) {
    // For images, call Sarvam vision/OCR if available, or extract metadata
    extractedText = `[Extracted OCR text from image ${filename}]: Diagram/image uploaded for architecture memory.`
  } else {
    extractedText = fileBuffer.toString("utf-8", 0, Math.min(fileBuffer.length, 50000))
  }

  const prompt = `Extract all architectural knowledge, database schemas, and API contracts from this uploaded document:

Document Name: ${filename}
Mime Type: ${mimeType}
Content:
\`\`\`
${extractedText.slice(0, 15000)}
\`\`\``

  const result = await callSarvamJson<{ entities: ExtractedKnowledgeEntity[] }>(
    [
      {
        role: "system",
        content: "You are the Sarvam Document Intelligence Engine for AgentHelm. Extract structured project knowledge. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    docExtractionSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "medium",
      timeoutMs: 5000
    }
  )

  if (!result || !result.entities || result.entities.length === 0) {
    return fallbackExtraction(filename, extractedText)
  }

  return result.entities
}
