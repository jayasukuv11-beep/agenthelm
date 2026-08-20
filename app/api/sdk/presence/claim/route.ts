import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { getUpstashConfig } from '@/lib/redis'
import { z } from 'zod'

const presenceClaimRouteSchema = z.object({
  agent_id: z.string().uuid().optional(),
  file: z.string().min(1),
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: presenceClaimRouteSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body } = ctx
    const { file } = body

    const cfg = getUpstashConfig()
    if (!cfg) {
      const { data: existing } = await supabase
        .from('agent_presence')
        .select('agent_id, agents(name)')
        .eq('current_file', file)
        .neq('agent_id', agentId)
        .single()

      if (existing) {
        const ownerName = Array.isArray(existing.agents)
          ? (existing.agents[0] as any)?.name
          : (existing.agents as any)?.name || 'Unknown Agent'
        return NextResponse.json({ claimed: false, owner: ownerName })
      }

      await supabase
        .from('agent_presence')
        .update({ current_file: file })
        .eq('agent_id', agentId)

      return NextResponse.json({ claimed: true })
    }

    const redisKey = `file_lock:${encodeURIComponent(file)}`

    const res = await fetch(`${cfg.url}/set/${redisKey}/${agentId}?EX=60&NX`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}` }
    })
    const data = await res.json()

    if (data.result === 'OK') {
      await supabase
        .from('agent_presence')
        .update({ current_file: file })
        .eq('agent_id', agentId)
      return NextResponse.json({ claimed: true })
    } else {
      const getRes = await fetch(`${cfg.url}/get/${redisKey}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cfg.token}` }
      })
      const getData = await getRes.json()
      const currentOwnerId = getData.result

      if (currentOwnerId === agentId) {
        await fetch(`${cfg.url}/expire/${redisKey}/60`, {
          headers: { Authorization: `Bearer ${cfg.token}` }
        })
        return NextResponse.json({ claimed: true })
      }

      const { data: existing } = await supabase
        .from('agents')
        .select('name')
        .eq('id', currentOwnerId)
        .single()

      const ownerName = existing?.name || 'Unknown Agent'

      await supabase
        .from('ai_timeline_events')
        .insert({
          agent_id: agentId,
          event_type: 'file_ownership_blocked',
          title: `Blocked from editing ${file}`,
          details: { blocked_by: currentOwnerId, file }
        })

      return NextResponse.json({ claimed: false, owner: ownerName })
    }
  }
)
