import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { authorizeSdkAgent, hasError } from '@/lib/sdk-auth'
import { createClient as createServerSupabase } from '@/app/lib/supabase'

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const agent_id = searchParams.get('agent_id')

    const auth = await authorizeSdkAgent(key, agent_id)
    if (hasError(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth

    // Fetch pending commands
    const { data: commands, error } = await supabaseAdmin
      .from('agent_commands')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('status', 'pending')

    if (error) throw error

    // Mark as delivering
    if (commands && commands.length > 0) {
      const commandIds = (commands as any[]).map(c => c.id)
      await supabaseAdmin
        .from('agent_commands')
        .update({ status: 'delivering' })
        .in('id', commandIds)
    }

    return NextResponse.json({ commands: commands || [] })

  } catch (err: any) {
    console.error('Command GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const body = await req.json()
    const { agent_id, command_type, payload } = body

    // If called from SDK (connect_key auth), keep existing behavior
    if (key) {
      const auth = await authorizeSdkAgent(key, agent_id)
      if (hasError(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status })

      const { supabaseAdmin } = auth

      const { data: command, error } = await supabaseAdmin
        .from('agent_commands')
        .insert({
          agent_id,
          command_type,
          payload: payload || {},
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, command_id: command.id })
    }

    // Dashboard UI call: require session, rely on RLS
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership (explicit check)
    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', authData.user.id)
      .single()

    if (agentErr) throw agentErr
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
    }

    const { data: command, error } = await supabase
      .from('agent_commands')
      .insert({
        agent_id,
        command_type,
        payload: payload || {},
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, command_id: command.id })

  } catch (err: any) {
    console.error('Command POST error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { key, command_id, agent_id, status } = body

    if (!command_id || !agent_id || status !== 'delivered') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const auth = await authorizeSdkAgent(key, agent_id)
    if (hasError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabaseAdmin } = auth

    // Acknowledge command delivery
    const { data: command, error } = await supabaseAdmin
      .from('agent_commands')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', command_id)
      .eq('agent_id', auth.agent.id)
      .eq('status', 'delivering')
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!command) {
      return NextResponse.json({ error: 'Command not found or unavailable' }, { status: 404 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Command PATCH error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
