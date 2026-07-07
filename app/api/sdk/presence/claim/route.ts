import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'
import { getUpstashConfig } from '@/lib/redis'
import { checkRateLimit } from '@/lib/rate-limit'

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
    
    if (!token && body.key) token = body.key

    if (token) {
      if (!checkRateLimit(token, 120, 60)) {
        return NextResponse.json({ error: 'Rate limit exceeded (120 per min)' }, { status: 429 })
      }
    }

    const auth: any = await validateConnectKey(token)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin, agentId } = auth as any
    const { file } = body

    if (!file) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Check ownership using Upstash Redis SET NX for atomic locking
    const cfg = getUpstashConfig()
    if (!cfg) {
        // Fallback to postgres agent_presence if Redis isn't configured
        const { data: existing } = await supabaseAdmin
            .from('agent_presence')
            .select('agent_id, agents(name)')
            .eq('current_file', file)
            .neq('agent_id', agentId)
            .single()

        if (existing) {
            const ownerName = Array.isArray(existing.agents) 
                ? existing.agents[0]?.name 
                : (existing.agents as any)?.name || 'Unknown Agent'
            return NextResponse.json({ claimed: false, owner: ownerName })
        }

        // Claim it
        await supabaseAdmin
            .from('agent_presence')
            .update({ current_file: file })
            .eq('agent_id', agentId)

        return NextResponse.json({ claimed: true })
    }

    // Upstash Redis Atomic Lock (TTL 60s)
    const redisKey = `file_lock:${encodeURIComponent(file)}`
    
    // Attempt to set with NX (Only if Not Exists)
    const res = await fetch(`${cfg.url}/set/${redisKey}/${agentId}?EX=60&NX`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}` }
    })
    const data = await res.json()

    if (data.result === 'OK') {
        // We acquired the lock
        await supabaseAdmin
            .from('agent_presence')
            .update({ current_file: file })
            .eq('agent_id', agentId)
        return NextResponse.json({ claimed: true })
    } else {
        // Lock already exists, fetch who owns it
        const getRes = await fetch(`${cfg.url}/get/${redisKey}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${cfg.token}` }
        })
        const getData = await getRes.json()
        const currentOwnerId = getData.result

        if (currentOwnerId === agentId) {
            // We already own it, renew TTL
            await fetch(`${cfg.url}/expire/${redisKey}/60`, {
                headers: { Authorization: `Bearer ${cfg.token}` }
            })
            return NextResponse.json({ claimed: true })
        }

        // Owned by someone else
        const { data: existing } = await supabaseAdmin
            .from('agents')
            .select('name')
            .eq('id', currentOwnerId)
            .single()

        const ownerName = existing?.name || 'Unknown Agent'
        
        // Log intervention event (optional tracking)
        await supabaseAdmin
          .from('ai_timeline_events')
          .insert({
            agent_id: agentId,
            event_type: 'file_ownership_blocked',
            title: `Blocked from editing ${file}`,
            details: { blocked_by: currentOwnerId, file }
          })

        return NextResponse.json({ claimed: false, owner: ownerName })
    }

  } catch (err) {
    console.error('File claim error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
