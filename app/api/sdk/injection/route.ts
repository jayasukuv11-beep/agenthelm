import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const injectionPostSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().optional(),
  input_text: z.string().optional(),
  trust_score: z.number().optional(),
  flags: z.array(z.string()).optional(),
  action_taken: z.string().optional()
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: injectionPostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const { task_id, input_text, trust_score, flags, action_taken } = body

    if (task_id) {
      const { data: taskExists } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('id', task_id)
        .maybeSingle()

      if (!taskExists) {
        await supabase
          .from('agent_tasks')
          .insert({
            id: task_id,
            agent_id: agentId,
            user_id: userId,
            task_description: 'Auto-detected Task',
            status: 'running',
            source: 'dashboard',
            started_at: new Date().toISOString()
          })
      }
    }

    const { error: insertError } = await supabase
      .from('injection_events')
      .insert({
        agent_id: agentId,
        task_id: task_id || null,
        input_text: input_text ? String(input_text).substring(0, 5000) : null,
        trust_score: typeof trust_score === 'number' ? trust_score : null,
        flags: Array.isArray(flags) ? flags : [],
        action_taken: action_taken || 'warned'
      })

    if (insertError) throw insertError

    await supabase
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        type: 'injection',
        level: action_taken === 'blocked' ? 'error' : 'warning',
        message: `Prompt Injection Detected (Score: ${trust_score}) [Action: ${action_taken}]`,
        data: { flags, input_preview: input_text ? String(input_text).substring(0, 200) : '' }
      })

    return NextResponse.json({ success: true })
  }
)
