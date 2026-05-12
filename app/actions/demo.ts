'use server'

import { createClient } from '@/app/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function loadDemoData() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Create a demo agent
  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      name: "Demo Analytics Agent",
      status: "running",
      agent_type: "python",
      version: "1.0.0-demo",
      last_ping: new Date().toISOString(),
    })
    .select()
    .single()

  if (agentErr) throw agentErr

  // 3. Create demo tasks (traces)
  const demoTasks = [
    {
      agent_id: agent.id,
      user_id: user.id,
      task_description: "Research market trends for AI governance",
      status: "completed",
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    },
    {
      agent_id: agent.id,
      user_id: user.id,
      task_description: "Web scraping production logs for anomalies",
      status: "running",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
    },
    {
      agent_id: agent.id,
      user_id: user.id,
      task_description: "Analyze security boundaries for Agent-007",
      status: "completed",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    },
    {
      agent_id: agent.id,
      user_id: user.id,
      task_description: "Generate weekly safety report",
      status: "failed",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
    }
  ]

  const { error: tasksErr } = await supabase.from('agent_tasks').insert(demoTasks)
  if (tasksErr) throw tasksErr

  // 4. Add some logs for the demo agent
  const demoLogs = [
    {
      agent_id: agent.id,
      type: "log",
      level: "info",
      message: "Booting demo agent...",
      created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString()
    },
    {
      agent_id: agent.id,
      type: "log",
      level: "success",
      message: "Connection established with AgentHelm Mission Control",
      created_at: new Date(Date.now() - 1000 * 60 * 64).toISOString()
    }
  ]
  
  await supabase.from('agent_logs').insert(demoLogs)

  revalidatePath('/dashboard')
  return { success: true }
}
