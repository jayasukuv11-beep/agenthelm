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
    const { key, agent_id, label, data, tokens_used = 0, model } = body

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin } = auth

    // Verify agent belongs to user
    const { data: agent } = await supabaseAdmin!
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', userId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
    }

    // Store complex output as formatted message and raw JSON data
    await supabaseAdmin!
      .from('agent_logs')
      .insert({
        agent_id,
        type: 'output',
        level: 'success',
        message: label ? `Output: ${label}` : 'Task output generated',
        data: data || {},
        tokens_used,
        model: model || null
      })

    // If tokens are tracked here directly instead of the 'tokens' type log, insert to credits
    if (tokens_used > 0) {
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

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Output error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
