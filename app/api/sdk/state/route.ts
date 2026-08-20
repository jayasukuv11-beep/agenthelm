import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { getUpstashConfig } from '@/lib/redis'
import { z } from 'zod'

const stateRouteSchema = z.object({
  agent_id: z.string().uuid().optional(),
  task: z.any().optional(),
  progress: z.any().optional(),
  status: z.string().optional(),
  current_step: z.any().optional(),
  current_file: z.any().optional(),
  state: z.record(z.string(), z.any()).optional(),
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: stateRouteSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const { task, progress, status, current_step, current_file, state } = body

    const statePayload = {
      task,
      progress,
      status,
      current_step,
      current_file,
      state,
      updated_at: Date.now()
    }

    // 1. Write to Upstash Redis
    const cfg = getUpstashConfig()
    if (cfg) {
      const redisKey = `agent:${agentId}:state`
      await fetch(`${cfg.url}/set/${encodeURIComponent(redisKey)}?EX=30`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(statePayload)
      }).catch(err => console.error('Redis write error:', err))
    }

    // 2. Upsert agents table: status, last_seen
    await supabase
      .from('agents')
      .update({ 
        status: status || 'running', 
        last_seen: new Date().toISOString() 
      })
      .eq('id', agentId)

    // 3. Broadcast via Supabase Realtime
    const channel = supabase.channel(`presence:${userId}`)
    channel.subscribe(async (subStatus: string) => {
      if (subStatus === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'agent_state',
          payload: { agent_id: agentId, ...statePayload }
        }).catch((err: any) => console.error('Broadcast error:', err))
        supabase.removeChannel(channel)
      }
    })

    return NextResponse.json({ success: true })
  }
)
