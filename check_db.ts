import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function checkSupabase() {
  console.log("=== CHECKING SUPABASE DATABASE STATE ===")

  // 1. Projects
  const { data: projects, error: projErr } = await supabaseAdmin.from("projects").select("id, name, brain_version, active_entry_count")
  if (projErr) console.error("Projects Error:", projErr.message)
  else console.log("Projects:", JSON.stringify(projects, null, 2))

  // 2. Proposals
  const { data: proposals, error: propErr } = await supabaseAdmin.from("knowledge_proposals").select("id, project_id, build_status, review_notes, summary, created_at").order("created_at", { ascending: false }).limit(5)
  if (propErr) console.error("Proposals Error:", propErr.message)
  else console.log("Latest 5 Proposals:", JSON.stringify(proposals, null, 2))

  // 3. Brain Entries
  const { data: entries, error: entErr } = await supabaseAdmin.from("brain_entries").select("id, project_id, category, title, status").limit(5)
  if (entErr) console.error("Brain Entries Error:", entErr.message)
  else console.log("Latest 5 Brain Entries:", JSON.stringify(entries, null, 2))

  // 4. Brain Versions
  const { data: versions, error: verErr } = await supabaseAdmin.from("brain_versions").select("*").limit(5)
  if (verErr) console.error("Brain Versions Error:", verErr.message)
  else console.log("Brain Versions:", JSON.stringify(versions, null, 2))
}

checkSupabase().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
