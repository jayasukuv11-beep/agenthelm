import { callSarvamJson } from "./sarvam-client"
import type { KnowledgeProposal } from "../types"

export interface EvidenceAssessment {
  evidence_quality: "strong" | "moderate" | "weak" | "irrelevant"
  quality_score: number
  reasoning: string
  missing_evidence: string[]
  risk_factors: string[]
}

const evidenceSchema = {
  name: "evidence_quality_assessment",
  schema: {
    type: "object",
    properties: {
      evidence_quality: {
        type: "string",
        enum: ["strong", "moderate", "weak", "irrelevant"],
        description: "Qualitative rating of the proposal evidence"
      },
      quality_score: {
        type: "number",
        description: "Qualitative evidence score from 0 to 100"
      },
      reasoning: {
        type: "string",
        description: "Explanation of why the evidence is strong, moderate, or weak"
      },
      missing_evidence: {
        type: "array",
        items: { type: "string" },
        description: "Evidence that would increase certainty (e.g. tests, PR link, schema diff)"
      },
      risk_factors: {
        type: "array",
        items: { type: "string" },
        description: "Identified architectural or stability risks"
      }
    },
    required: ["evidence_quality", "quality_score", "reasoning", "missing_evidence", "risk_factors"],
    additionalProperties: false
  }
}

export async function assessEvidenceQuality(
  proposal: KnowledgeProposal,
  baseScore: number
): Promise<EvidenceAssessment | null> {
  const prompt = `Assess the evidence backing this knowledge proposal:

Summary: ${proposal.summary}
Commit SHA: ${proposal.commit_sha || 'none'}
Branch: ${proposal.branch || 'none'}
Tests Passed: ${proposal.tests_passed === true ? 'Yes' : 'No'}
Human Reviewed: ${proposal.human_reviewed === true ? 'Yes' : 'No'}
Files Modified: ${JSON.stringify(proposal.files_modified || [])}
Decisions: ${JSON.stringify(proposal.decisions || [])}
Base Deterministic Score: ${baseScore}/100

Rate the real-world evidence quality, identify missing proof, and highlight potential risks.`

  const result = await callSarvamJson<EvidenceAssessment>(
    [
      {
        role: "system",
        content: "You are the Evidence Assessor for AgentHelm's Brain Compiler. Output strict JSON."
      },
      { role: "user", content: prompt }
    ],
    evidenceSchema,
    {
      model: "sarvam-105b",
      reasoningEffort: "medium",
      timeoutMs: 5000
    }
  )

  return result
}
