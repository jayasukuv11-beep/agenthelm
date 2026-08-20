import { callSarvamJson } from "./sarvam-client"
import type { BrainCategory, KnowledgeProposal } from "../types"

export interface SarvamClassification {
  category: BrainCategory
  risk_level: "low" | "medium" | "high"
  action: "allow" | "review" | "reject"
  confidence: number
  reason: string
  related_categories: string[]
  summary_for_brain: string
  semantic_tags: string[]
}

const classificationSchema = {
  name: "proposal_classification",
  schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        enum: ["architecture", "decisions", "apis", "database", "standards", "infrastructure", "notes"],
        description: "Primary category of the knowledge proposal"
      },
      risk_level: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Risk level of incorporating this change into project memory"
      },
      action: {
        type: "string",
        enum: ["allow", "review", "reject"],
        description: "Recommended policy action"
      },
      confidence: {
        type: "number",
        description: "Confidence score between 0.0 and 1.0"
      },
      reason: {
        type: "string",
        description: "Concise justification for category, risk, and action"
      },
      related_categories: {
        type: "array",
        items: { type: "string" },
        description: "Secondary or cross-cutting categories impacted"
      },
      summary_for_brain: {
        type: "string",
        description: "Clean, standardized one-line summary for long-term project memory"
      },
      semantic_tags: {
        type: "array",
        items: { type: "string" },
        description: "Searchable semantic keywords and concepts"
      }
    },
    required: [
      "category",
      "risk_level",
      "action",
      "confidence",
      "reason",
      "related_categories",
      "summary_for_brain",
      "semantic_tags"
    ],
    additionalProperties: false
  }
}

export function fallbackClassification(proposal: Partial<KnowledgeProposal>): SarvamClassification {
  let category: BrainCategory = "notes"
  const tags: string[] = []

  if (Array.isArray(proposal.db_changes) && proposal.db_changes.length > 0) {
    category = "database"
    tags.push("database", "schema")
  } else if (Array.isArray(proposal.apis_affected) && proposal.apis_affected.length > 0) {
    category = "apis"
    tags.push("api", "endpoint")
  } else if (Array.isArray(proposal.decisions) && proposal.decisions.length > 0) {
    category = "decisions"
    tags.push("architecture", "decision")
  } else if (proposal.files_modified && proposal.files_modified.some(f => String(f).includes('config') || String(f).includes('rule'))) {
    category = "standards"
    tags.push("standards", "conventions")
  }

  const rawSummary = proposal.summary || "Agent proposed knowledge update"

  return {
    category,
    risk_level: category === "database" ? "high" : "medium",
    action: "review",
    confidence: 0.75,
    reason: "Deterministic fallback classification based on modified resource types",
    related_categories: [],
    summary_for_brain: rawSummary.trim(),
    semantic_tags: tags.length > 0 ? tags : ["agent-proposal"]
  }
}

export async function classifyProposal(proposal: KnowledgeProposal): Promise<SarvamClassification> {
  const observation = [
    `Summary: ${proposal.summary || ''}`,
    `Decisions: ${JSON.stringify(proposal.decisions || [])}`,
    `Files: ${JSON.stringify(proposal.files_modified || [])}`,
    `APIs: ${JSON.stringify(proposal.apis_affected || [])}`,
    `DB changes: ${JSON.stringify(proposal.db_changes || [])}`,
    `Branch: ${proposal.branch || ''}`,
    `Commit: ${proposal.commit_sha || ''}`
  ].join("\n")

  const systemPrompt = `You are the Brain Compiler Classifier for AgentHelm.
Classify this knowledge proposal from an AI agent into structured project memory.
Categories:
- architecture: High-level system structure, components, data flows
- decisions: Architectural and engineering trade-offs and rationale
- apis: Endpoints, contracts, schemas, request/response formats
- database: Tables, columns, migrations, indices, relationships
- standards: Code style, linting rules, naming conventions, patterns
- infrastructure: Docker, CI/CD, deployment configs, cloud services
- notes: General observations, temporary notes

Assess risk:
- high: DB drops/alterations, breaking API changes, security changes
- medium: New endpoints, new tables, structural modifications
- low: Documentation, comments, additive non-breaking notes`

  const result = await callSarvamJson<SarvamClassification>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: observation }
    ],
    classificationSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "medium",
      timeoutMs: 5000
    }
  )

  if (!result || !result.category) {
    return fallbackClassification(proposal)
  }

  return result
}
