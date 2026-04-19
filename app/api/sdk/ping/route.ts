import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey, issueAgentToken } from '@/lib/sdk-auth'

// Handle CORS preflight
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

// In-memory rate limiting map for MVP (store key -> { count, windowStart })
const RATE_LIMITS = new Map<string, { count: number, start: number }>()

function checkRateLimit(key: string) {
  const now = Date.now()
  const current = RATE_LIMITS.get(key)
  
  if (!current || now - current.start > 60000) {
    // Reset window
    RATE_LIMITS.set(key, { count: 1, start: now })
    return true
  }
  
  if (current.count >= 6) {
    return false // Max 6 requests per min
  }
  
  current.count++
  RATE_LIMITS.set(key, current)
  return true
}

export async function POST(req: Request) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { key, name, agent_type, version, status, error_message } = body

    if (!checkRateLimit(key)) {
      return NextResponse.json({ error: 'Rate limit exceeded (6 per min)' }, { status: 429 })
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { userId, supabaseAdmin } = auth
    const { getUserUsage } = await import('@/lib/usage')
    const usage = await getUserUsage(userId)

    let agentId = body.agent_id
    let existingAgent = null

    if (agentId) {
      const { data } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agentId)
        .eq('user_id', userId)
        .maybeSingle()
      existingAgent = data
    }

    if (!existingAgent && name) {
      const { data } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .maybeSingle()
      existingAgent = data
    }

    agentId = existingAgent?.id

    if (agentId) {
      // Update existing
      await supabaseAdmin!
        .from('agents')
        .update({
          status,
          agent_type,
          version,
          error_message: error_message || null,
          last_ping: new Date().toISOString()
        })
        .eq('id', agentId)
    } else {
      // Create new - ENFORCE LIMIT
      if (usage.agentCount >= usage.agentLimit) {
        return NextResponse.json({ 
          error: 'agent_limit_reached', 
          message: `Your current plan (${usage.plan}) is limited to ${usage.agentLimit} agents. Upgrade to connect more.`,
          upgrade_url: '/dashboard/settings'
        }, { status: 402 })
      }

      const { data: newAgent, error: insertError } = await supabaseAdmin!
        .from('agents')
        .insert({
          user_id: userId,
          name,
          status,
          agent_type,
          version,
          error_message: error_message || null,
          last_ping: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      agentId = newAgent.id
    }

    // Issue the short-lived JWT for the Handshake Protocol
    const agentToken = await issueAgentToken(userId, agentId, auth.plan)

    // Phase 5: Fetch tool permissions
    const { data: permissions } = await supabaseAdmin!
      .from('agent_tool_permissions')
      .select('allowed_tools, block_mode')
      .eq('agent_id', agentId)
      .single()

    return NextResponse.json({ 
      agent_id: agentId, 
      user_id: userId,
      plan: auth.plan,
      success: true,
      agent_token: agentToken,
      permissions: permissions || null
    })

  } catch (err: any) {
    console.error('Ping error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
