import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const memoryPayloadSchema = z.object({
  agent_id: z.string().uuid(),
  index_content: z.any().optional(),
  key: z.string().optional(),
  value: z.any().optional()
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: memoryPayloadSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const index_content = body.index_content || (body.key ? { [body.key]: body.value } : null)

    if (!index_content) {
      return NextResponse.json({ error: 'Missing memory content' }, { status: 400 })
    }

    const { error } = await supabase
      .from('agent_memory')
      .upsert({
        agent_id: agentId,
        user_id: userId,
        index_content,
        last_synced_at: new Date().toISOString()
      }, { onConflict: 'agent_id' })

    if (error) {
      console.error('Error syncing agent memory:', error)
      return NextResponse.json({ error: 'Failed to sync memory' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
)
