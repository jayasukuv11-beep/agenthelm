import type { SupabaseClient } from "@supabase/supabase-js"
import { extractKnowledgeFromFile } from "./providers/sarvam-extract"
import { compileProposal } from "../brain-compiler"
import crypto from "crypto"

export interface SeedingResult {
  entries_proposed: number
  entries_auto_applied: number
  entries_gated: number
  errors: string[]
}

const SEED_TARGET_FILES = [
  "README.md",
  "openapi.yaml",
  "openapi.json",
  "swagger.yaml",
  "schema.sql",
  "prisma/schema.prisma",
  "drizzle/schema.ts",
  ".cursorrules",
  "CLAUDE.md",
  "AGENTS.md",
  "docker-compose.yml",
  "Dockerfile"
]

export async function fetchFileFromGitHub(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "AgentHelm-Seeder"
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const response = await fetch(url, { headers })
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  }
}

export function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.replace(/\.git$/, '').replace(/\/$/, '')
    const parts = cleaned.split('/')
    if (parts.length < 2) return null
    const repo = parts[parts.length - 1]
    const owner = parts[parts.length - 2]
    return { owner, repo }
  } catch {
    return null
  }
}

export async function seedBrainFromRepo(
  supabase: SupabaseClient,
  projectId: string,
  repoUrl: string,
  githubToken?: string
): Promise<SeedingResult> {
  const result: SeedingResult = {
    entries_proposed: 0,
    entries_auto_applied: 0,
    entries_gated: 0,
    errors: []
  }

  const parsed = parseGitHubRepoUrl(repoUrl)
  if (!parsed) {
    result.errors.push("Invalid GitHub repository URL format")
    return result
  }

  for (const filename of SEED_TARGET_FILES) {
    const fileContent = await fetchFileFromGitHub(parsed.owner, parsed.repo, filename, githubToken)
    if (!fileContent) continue

    try {
      const entities = await extractKnowledgeFromFile(filename, fileContent)

      for (const entity of entities) {
        const contentHash = crypto.createHash("sha256")
          .update(`${projectId}:${filename}:${entity.summary}:${JSON.stringify(entity.key_facts)}`)
          .digest("hex")

        const { data: proposal, error: insertError } = await supabase
          .from("knowledge_proposals")
          .insert({
            project_id: projectId,
            agent_id: "00000000-0000-0000-0000-000000000000", // System seeder
            content_hash: contentHash,
            summary: entity.summary,
            decisions: entity.category === "decisions" ? [{ fact: entity.summary, details: entity.key_facts }] : [],
            files_modified: [filename],
            apis_affected: entity.category === "apis" ? [{ facts: entity.key_facts }] : [],
            db_changes: entity.category === "database" ? [{ tables: entity.key_facts }] : [],
            architecture: entity.category === "architecture" ? [{ details: entity.key_facts }] : [],
            build_status: "pending",
            evidence_score: 80,
            tests_passed: true,
            human_reviewed: false
          })
          .select("id")
          .single()

        if (insertError) {
          if (insertError.code === "23505") continue // Already exists
          result.errors.push(`Failed to insert seed proposal for ${filename}: ${insertError.message}`)
          continue
        }

        result.entries_proposed++

        // Compile proposal through 8-stage pipeline
        const compileResult = await compileProposal(proposal.id)
        if (compileResult?.outcome === "merged") {
          result.entries_auto_applied++
        } else if (compileResult?.outcome === "reviewing") {
          result.entries_gated++
        }
      }
    } catch (err: any) {
      result.errors.push(`Extraction failed for ${filename}: ${err.message || String(err)}`)
    }
  }

  return result
}
