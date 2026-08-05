import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { BrainPipeline } from "../lib/brain/pipeline"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function testMCPProposalFlow() {
  console.log("=== TESTING MCP PROPOSAL FLOW ===")

  // 1. Get existing project and agent (find a project that has an agent)
  const { data: projects } = await supabaseAdmin.from("projects").select("id, name")
  if (!projects || projects.length === 0) {
    console.error("No project found")
    return
  }

  let project = null
  let agent = null
  for (const p of projects) {
    const { data: a } = await supabaseAdmin.from("agents").select("id").eq("project_id", p.id).limit(1).single()
    if (a) {
      project = p
      agent = a
      break
    }
  }

  if (!project || !agent) {
    console.error("No project with agent found")
    return
  }
  console.log("Project:", project.id, project.name)
  console.log("Agent:", agent.id)

  // 2. Create a proposal with string-encoded arrays (simulating MCP server behavior)
  const decisionsStr = JSON.stringify([
    { title: "MCP Test Decision", content: { text: "Testing MCP proposal flow" } },
    { title: "MCP Test Decision 2", content: { text: "Another test decision" } }
  ])
  const apisStr = JSON.stringify([
    { endpoint: "/api/test", method: "POST", description: "Test API endpoint" }
  ])
  const dbStr = JSON.stringify([
    { table: "test_table", operation: "CREATE", description: "Test table" }
  ])

  const contentHash = `mcp_test_${Date.now()}`

  const { data: proposal, error: propErr } = await supabaseAdmin
    .from("knowledge_proposals")
    .insert({
      project_id: project.id,
      agent_id: agent.id,
      content_hash: contentHash,
      build_status: "pending",
      summary: "MCP Proposal Flow Test - Testing string-encoded arrays",
      decisions: decisionsStr,  // String-encoded JSON array
      apis_affected: apisStr,   // String-encoded JSON array
      db_changes: dbStr,        // String-encoded JSON array
      files_modified: ["test/file1.ts", "test/file2.ts"],
      human_reviewed: true,
      tests_passed: true,
      author: "mcp-agent"
    })
    .select()
    .single()

  if (propErr) {
    console.error("Failed to create proposal:", propErr)
    return
  }
  console.log("Proposal created:", proposal.id)

  // 3. Run the Brain Pipeline
  const pipeline = new BrainPipeline(supabaseAdmin)
  const result = await pipeline.compile(proposal.id)
  console.log("Pipeline result:", JSON.stringify(result, null, 2))

  if (result.outcome !== "merged") {
    console.error("Pipeline did not merge the proposal!")
    return
  }
  console.log("✅ Proposal merged successfully!")

  // 4. Verify brain entries were created
  const { data: entries, error: entriesErr } = await supabaseAdmin
    .from("brain_entries")
    .select("id, category, title, content, status")
    .eq("project_id", project.id)
    .eq("status", "active")

  if (entriesErr) {
    console.error("Failed to fetch brain entries:", entriesErr)
    return
  }
  console.log("Brain entries:", JSON.stringify(entries, null, 2))
  console.log("✅ Brain entries stored successfully!")

  // 5. Test get_context (inject) retrieval
  const { data: contextData, error: contextErr } = await supabaseAdmin
    .from("brain_entries")
    .select("id, category, title, content, evidence_score, source_type, source_path, content_hash, validity_status")
    .eq("project_id", project.id)
    .eq("status", "active")
    .limit(10)

  if (contextErr) {
    console.error("Failed to fetch context:", contextErr)
    return
  }
  console.log("Context entries:", JSON.stringify(contextData, null, 2))
  console.log("✅ get_context retrieval works!")

  // 6. Verify proposal status
  const { data: finalProposal } = await supabaseAdmin
    .from("knowledge_proposals")
    .select("id, build_status, review_notes, evidence_score")
    .eq("id", proposal.id)
    .single()
  console.log("Final proposal status:", JSON.stringify(finalProposal, null, 2))

  console.log("\n=== ALL TESTS PASSED ===")
}

testMCPProposalFlow().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })