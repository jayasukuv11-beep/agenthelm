import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const taskCompleteSchema = z.object({
  agent_id: z.string().uuid().optional(),
  task_id: z.string().min(1),
  result: z.any().optional(),
  error: z.string().optional()
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: taskCompleteSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body } = ctx
    const { task_id, result } = body

    const { error } = await supabase
      .from('agent_tasks')
      .update({
        status: body.error ? 'failed' : 'completed',
        result: result || null,
        completed_at: new Date().toISOString()
      })
      .eq('id', task_id)
      .eq('agent_id', agentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  }
)
