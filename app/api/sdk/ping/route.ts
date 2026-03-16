import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

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
    const body = await req.json()
    const { key, name, agent_type, version, status, error_message } = body

    if (!checkRateLimit(key)) {
      return NextResponse.json({ error: 'Rate limit exceeded (6 per min)' }, { status: 429 })
    }

    const auth = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { userId, supabaseAdmin } = auth

    // Find agent by user_id and name
    const { data: existingAgent } = await supabaseAdmin!
      .from('agents')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single()

    let agentId = existingAgent?.id

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
      // Create new
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

    return NextResponse.json({ 
      agent_id: agentId, 
      user_id: userId,
      plan: auth.plan,
      success: true
    })

  } catch (err: any) {
    console.error('Ping error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
