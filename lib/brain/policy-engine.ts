import type { KnowledgeProposal } from "./types"

export type PolicyMode = "gated" | "auto" | "shadow" | "disabled"
export type PolicyDecision = "allow" | "review" | "reject" | "shadow"

export interface PolicyRule {
  id?: string
  name: string
  pattern?: string // regex pattern on summary/decisions/content
  category?: string
  min_evidence?: number
  action?: PolicyDecision
}

export interface ProjectPolicyConfig {
  mode: PolicyMode
  auto_apply_rules?: PolicyRule[]
  gate_rules?: PolicyRule[]
  reject_rules?: PolicyRule[]
  thresholds?: {
    min_evidence_score?: number
    max_risk_level?: string
  }
}

export interface PolicyResult {
  decision: PolicyDecision
  rules_matched: string[]
  reason: string
  mode: PolicyMode
  elapsed_ms: number
}

// ─── Hardcoded Backstop Regex Patterns (Cannot be overridden) ──────────────────

const FORBIDDEN_PATTERNS = [
  { name: "Prompt Injection (ignore instructions)", regex: /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i },
  { name: "Prompt Injection (system prompt override)", regex: /(system\s+prompt\s+override|disregard\s+all\s+guardrails)/i },
  { name: "AWS Access Key Leak", regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "GitHub Personal Access Token Leak", regex: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/ },
  { name: "Generic Secret Key Leak", regex: /\b(sk-[a-zA-Z0-9]{20,}|Bearer\s+[a-zA-Z0-9_\-\.]{30,})\b/i },
  { name: "Private Key Header Leak", regex: /-----BEGIN (RSA|OPENSSH|EC|DSA|PRIVATE)? KEY-----/i }
]

function matchesRule(rule: PolicyRule, text: string, category?: string): boolean {
  if (rule.category && category && rule.category.toLowerCase() !== category.toLowerCase()) {
    return false
  }
  if (rule.pattern) {
    try {
      const rx = new RegExp(rule.pattern, "i")
      if (rx.test(text)) return true
    } catch {
      return false
    }
  }
  return !rule.pattern // if category matched and no pattern specified
}

export function evaluatePolicy(
  proposal: KnowledgeProposal,
  config?: ProjectPolicyConfig | null,
  evidenceScore: number = 0,
  category?: string
): PolicyResult {
  const start = Date.now()
  const mode: PolicyMode = config?.mode || "gated"
  const searchableText = [
    proposal.summary || "",
    JSON.stringify(proposal.decisions || []),
    JSON.stringify(proposal.files_modified || []),
    JSON.stringify(proposal.apis_affected || []),
    JSON.stringify(proposal.db_changes || [])
  ].join("\n")

  // 1. Hardcoded Backstop Check (Non-overridable)
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.regex.test(searchableText)) {
      return {
        decision: "reject",
        rules_matched: [forbidden.name],
        reason: `Hardcoded backstop triggered: ${forbidden.name}`,
        mode,
        elapsed_ms: Date.now() - start
      }
    }
  }

  // 2. Custom Reject Rules
  const matchedRejectRules: string[] = []
  if (config?.reject_rules && Array.isArray(config.reject_rules)) {
    for (const rule of config.reject_rules) {
      if (matchesRule(rule, searchableText, category)) {
        matchedRejectRules.push(rule.name)
      }
    }
  }

  if (matchedRejectRules.length > 0) {
    return {
      decision: "reject",
      rules_matched: matchedRejectRules,
      reason: `Proposal matched reject rule(s): ${matchedRejectRules.join(", ")}`,
      mode,
      elapsed_ms: Date.now() - start
    }
  }

  // 3. Disabled Mode (Allows all non-forbidden changes)
  if (mode === "disabled") {
    return {
      decision: "allow",
      rules_matched: ["mode:disabled"],
      reason: "Policy engine is disabled for this project",
      mode,
      elapsed_ms: Date.now() - start
    }
  }

  // 4. Shadow Mode (Evaluates rules and logs, but does not block)
  if (mode === "shadow") {
    return {
      decision: "shadow",
      rules_matched: ["mode:shadow"],
      reason: "Policy evaluation simulated under shadow mode (non-blocking)",
      mode,
      elapsed_ms: Date.now() - start
    }
  }

  // 5. Gated Mode (Default - all changes go to human review)
  if (mode === "gated") {
    return {
      decision: "review",
      rules_matched: ["mode:gated"],
      reason: "Project is in gated mode; requiring human review",
      mode,
      elapsed_ms: Date.now() - start
    }
  }

  // 6. Custom Gate Rules Check
  const matchedGateRules: string[] = []
  if (config?.gate_rules && Array.isArray(config.gate_rules)) {
    for (const rule of config.gate_rules) {
      if (matchesRule(rule, searchableText, category)) {
        matchedGateRules.push(rule.name)
      }
    }
  }

  if (matchedGateRules.length > 0) {
    return {
      decision: "review",
      rules_matched: matchedGateRules,
      reason: `Proposal matched gate rule(s): ${matchedGateRules.join(", ")}`,
      mode,
      elapsed_ms: Date.now() - start
    }
  }

  // 7. Auto Mode & Auto-apply Rules Check
  if (mode === "auto") {
    const minEvidence = config?.thresholds?.min_evidence_score ?? 60
    const matchedAutoRules: string[] = []

    if (config?.auto_apply_rules && Array.isArray(config.auto_apply_rules)) {
      for (const rule of config.auto_apply_rules) {
        if (matchesRule(rule, searchableText, category)) {
          const ruleMinEvidence = rule.min_evidence ?? minEvidence
          if (evidenceScore >= ruleMinEvidence) {
            matchedAutoRules.push(rule.name)
          }
        }
      }
    }

    if (matchedAutoRules.length > 0) {
      return {
        decision: "allow",
        rules_matched: matchedAutoRules,
        reason: `Auto-applied based on matching rules (${matchedAutoRules.join(", ")}) and evidence score (${evidenceScore} >= ${minEvidence})`,
        mode,
        elapsed_ms: Date.now() - start
      }
    }

    // If auto mode enabled without explicit matching rule, check evidence threshold
    if (evidenceScore >= minEvidence && category !== "database") {
      return {
        decision: "allow",
        rules_matched: ["auto:evidence_threshold"],
        reason: `Auto-applied: evidence score ${evidenceScore} exceeds threshold ${minEvidence}`,
        mode,
        elapsed_ms: Date.now() - start
      }
    }
  }

  // 8. Fail-safe default
  return {
    decision: "review",
    rules_matched: ["default:fail_safe"],
    reason: "No auto-apply criteria satisfied; defaulted to review",
    mode,
    elapsed_ms: Date.now() - start
  }
}
