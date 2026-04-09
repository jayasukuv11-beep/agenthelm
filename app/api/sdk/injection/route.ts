import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, task_id, input_text, trust_score, flags, action_taken } = body

    // Validate request
    if (!key || !agent_id) {
      return NextResponse.json({ error: 'Missing key or agent_id' }, { status: 400 })
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { userId, supabaseAdmin, agentId: jwtAgentId } = auth

    // Verify agent ownership if jwtAgentId does not match (fallback checking)
    if (jwtAgentId && jwtAgentId !== agent_id) {
      return NextResponse.json({ error: 'Agent ID mismatch' }, { status: 403 })
    } else if (!jwtAgentId) {
      const { data: dbAgent } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single()

      if (!dbAgent) {
        return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
      }
    }

    // Insert injection event
    const { error: insertError } = await supabaseAdmin!
      .from('injection_events')
      .insert({
        agent_id,
        task_id: task_id || null,
        input_text: input_text ? String(input_text).substring(0, 5000) : null,
        trust_score: typeof trust_score === 'number' ? trust_score : null,
        flags: Array.isArray(flags) ? flags : [],
        action_taken: action_taken || 'warned'
      })

    if (insertError) throw insertError

    // Also log this as telemetry for the timeline
    await supabaseAdmin!
      .from('agent_logs')
      .insert({
        agent_id,
        type: 'injection',
        level: action_taken === 'blocked' ? 'error' : 'warning',
        message: `Prompt Injection Detected (Score: ${trust_score}) [Action: ${action_taken}]`,
        data: { flags, input_preview: input_text ? String(input_text).substring(0, 200) : '' }
      })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Injection tracking error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
