import { describe, it, expect } from "vitest"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { SupabaseBrainRepository } from "../lib/brain/repositories/supabase-repository"
import { BrainPublisher } from "../lib/brain/brain-publisher"
import { BrainPipeline } from "../lib/brain/pipeline"
import { buildMergePlan } from "../lib/brain/merge-plan"
import { analyzeKnowledge } from "../lib/brain/knowledge-analyzer"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

describe("Supabase Publisher Debug", () => {
  it("creates a proposal and runs full BrainPipeline successfully", async () => {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // Get existing project and agent
    const { data: project } = await supabaseAdmin.from("projects").select("id").limit(1).single()
    if (!project) return
    const { data: agent } = await supabaseAdmin.from("agents").select("id").eq("project_id", project.id).limit(1).single()
    if (!agent) return

    // Create a new knowledge proposal
    const { data: proposal, error: propErr } = await supabaseAdmin
      .from("knowledge_proposals")
      .insert({
        project_id: project.id,
        agent_id: agent.id,
        content_hash: `hash_${Date.now()}`,
        build_status: "pending",
        summary: "CodeLens AI AST Parsing and Vector Search Integration",
        decisions: [{ title: "Tree-sitter AST Parser", content: { text: "Uses Tree-sitter for AST chunking" } }],
        apis_affected: [{ title: "FastAPI RAG Backend", content: { text: "FastAPI handles vector retrieval and Gemini API" } }],
        files_modified: ["app/parser.py", "app/rag.py"],
        human_reviewed: true,
        tests_passed: true,
      })
      .select()
      .single()

    expect(propErr).toBeNull()
    expect(proposal).toBeDefined()

    const repository = new SupabaseBrainRepository(supabaseAdmin)
    const publisher = new BrainPublisher(repository)
    const pipeline = new BrainPipeline(supabaseAdmin)

    const result = await pipeline.compile(proposal.id)
    console.log("PIPELINE END-TO-END RESULT:", JSON.stringify(result, null, 2))
    expect(result.ok).toBe(true)
    expect(result.outcome).toBe("merged")
  })
})
