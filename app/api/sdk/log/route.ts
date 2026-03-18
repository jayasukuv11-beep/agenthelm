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
    const { key, agent_id, type = 'log', level = 'info', message, data, tokens_used = 0, model } = body

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin } = auth

    // Verify agent belongs to user
    const { data: agent } = await supabaseAdmin!
      .from('agents')
      .select('id, user_id, name')
      .eq('id', agent_id)
      .eq('user_id', userId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
    }

    // Insert log
    await supabaseAdmin!
      .from('agent_logs')
      .insert({
        agent_id,
        type,
        level,
        message,
        data: data || null,
        tokens_used,
        model: model || null
      })

    // Handle token tracking 
    if (type === 'tokens' && tokens_used > 0) {
      let cost_usd = 0;
      if (model?.includes('gemini-flash')) cost_usd = tokens_used * 0.0000001;
      else if (model?.includes('gpt-4')) cost_usd = tokens_used * 0.00003;
      else if (model?.includes('sonnet')) cost_usd = tokens_used * 0.000015;

      await supabaseAdmin!
        .from('credit_usage')
        .insert({
          user_id: userId,
          agent_id,
          tokens_used,
          model,
          cost_usd
        })
    }

    // Handle error cascades
    if (level === 'error') {
      await supabaseAdmin!
        .from('agents')
        .update({ status: 'error', error_message: message })
        .eq('id', agent_id)
    }

    // Handle incoming chat replies from the SDK
    if (type === 'chat_reply') {
      const agentUserId = (agent as { user_id: string }).user_id
      await supabaseAdmin!
        .from('agent_chats')
        .insert({
          agent_id,
          user_id: agentUserId || userId,
          role: 'agent',
          content: message,
          source: 'dashboard'
        })
    }

    // Run anomaly check in background — do NOT await (never slow down SDK)
    const agentName = (agent as { name: string }).name
    setImmediate(async () => {
      const { checkAnomalies } = await import('@/lib/anomaly')
      await checkAnomalies(agent_id, userId!, agentName)
    })

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('Log error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
