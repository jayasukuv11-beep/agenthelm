import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const taskClaimSchema = z.object({
  agent_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional()
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: taskClaimSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const { title, description } = body

    // Check for existing running/pending task with same title
    const { data: existingTasks, error: checkError } = await supabase
      .from('agent_tasks')
      .select('id, status, agent_id, agents(name)')
      .eq('user_id', userId)
      .eq('title', title)
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (checkError) throw checkError

    const existingTask = existingTasks?.[0]
    if (existingTask) {
      const ownerName = Array.isArray(existingTask.agents)
        ? (existingTask.agents[0] as any)?.name
        : (existingTask.agents as any)?.name || 'Unknown Agent'

      return NextResponse.json({
        claimed: false,
        owner: ownerName
      })
    }

    // Insert new task
    const { data: newTask, error: insertError } = await supabase
      .from('agent_tasks')
      .insert({
        agent_id: agentId,
        user_id: userId,
        title: title,
        task_description: description || null,
        status: 'running',
        started_at: new Date().toISOString(),
        source: 'dashboard',
        claimed_by: agentId,
        assigned_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
      // Fallback if claimed_by column is not present
      if (insertError.code === 'PGRST204' || (insertError.message && insertError.message.includes('claimed_by'))) {
        const { data: fallbackTask, error: fallbackError } = await supabase
          .from('agent_tasks')
          .insert({
            agent_id: agentId,
            user_id: userId,
            title: title,
            task_description: description || null,
            status: 'running',
            started_at: new Date().toISOString(),
            source: 'dashboard'
          })
          .select('id')
          .single()

        if (fallbackError) throw fallbackError
        return NextResponse.json({ claimed: true, task_id: fallbackTask.id })
      }
      throw insertError
    }

    return NextResponse.json({ claimed: true, task_id: newTask.id })
  }
)
