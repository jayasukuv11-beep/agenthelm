import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function testCompileProposal() {
  const proposalId = "4479cb94-47ee-45ff-a23d-ef233b9a8851"
  console.log(`=== RESETTING & COMPILING PROPOSAL ${proposalId} ===`)

  // Reset to pending & clear rejection review notes
  const { error: updateErr } = await supabaseAdmin
    .from("knowledge_proposals")
    .update({ build_status: "pending", review_notes: null, human_reviewed: true })
    .eq("id", proposalId)

  if (updateErr) {
    console.error("Failed to reset proposal:", updateErr)
    return
  }

  // Import pipeline compiler directly
  const { compileProposal } = await import("./lib/brain-compiler")
  const result = await compileProposal(proposalId)
  console.log("Compile Result:", JSON.stringify(result, null, 2))

  // Fetch updated proposal
  const { data: prop } = await supabaseAdmin
    .from("knowledge_proposals")
    .select("id, build_status, review_notes")
    .eq("id", proposalId)
    .single()
  console.log("Updated Proposal Status in Supabase:", prop)

  // Fetch entries in brain_entries
  const { data: entries } = await supabaseAdmin
    .from("brain_entries")
    .select("id, category, title, status")
    .eq("project_id", prop?.project_id || "")
  console.log("Brain Entries written to Supabase:", entries)
}

testCompileProposal().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
