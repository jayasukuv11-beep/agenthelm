import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'
import { getUpstashConfig } from '@/lib/redis'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const body = await req.json().catch(() => ({}))
    
    // Fallback to body.key if Bearer token is not present
    if (!token && body.key) {
        token = body.key
    }

    const auth: any = await validateConnectKey(token)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin, agentId } = auth as any
    const { task, progress, status, current_step, current_file } = body

    const statePayload = { task, progress, status, current_step, current_file, updated_at: Date.now() }

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
    await supabaseAdmin
      .from('agents')
      .update({ 
        status: status || 'running', 
        last_seen: new Date().toISOString() 
      })
      .eq('id', agentId)

    // 3. Broadcast via Supabase Realtime
    const channel = supabaseAdmin.channel(`presence:${userId}`)
    channel.subscribe(async (subStatus: string) => {
      if (subStatus === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'agent_state',
          payload: { agent_id: agentId, ...statePayload }
        }).catch((err: any) => console.error('Broadcast error:', err))
        supabaseAdmin.removeChannel(channel)
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('State error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
