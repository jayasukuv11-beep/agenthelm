import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { authorizeSdkAgent, hasError } from '@/lib/sdk-auth'
import { createClient as createServerSupabase } from '@/app/lib/supabase'
import { getCorsHeaders } from '@/lib/middleware/sdk-gateway'

// Handle CORS preflight (no wildcard origin — scoped to known hosts)
export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}

function authHeader(req: Request, body?: any): string | null {
  // Credentials MUST come from the Authorization header (or x-connect-key),
  // never from query parameters — query strings leak into logs, proxies, history.
  const headerKey =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    req.headers.get('x-connect-key')?.trim() ||
    null
  if (headerKey) return headerKey
  // For POST bodies that carry `key` (SDK convenience), read it from the parsed body.
  if (body && typeof body.key === 'string') return body.key
  return null
}

export async function GET(req: Request) {
  try {
    // Reject query-parameter credentials outright.
    const url = new URL(req.url)
    if (url.searchParams.has('key')) {
      return NextResponse.json({ error: 'Credentials must be sent in the Authorization header, not the URL.' }, { status: 401, headers: getCorsHeaders(req) })
    }
    const key = authHeader(req)
    const agent_id = url.searchParams.get('agent_id')
    if (!key || !agent_id) {
      return NextResponse.json({ error: 'Missing authentication or agent_id' }, { status: 401, headers: getCorsHeaders(req) })
    }

    const auth = await authorizeSdkAgent(key, agent_id)
    if (hasError(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: getCorsHeaders(req) })

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

    return NextResponse.json({ commands: commands || [] }, { headers: getCorsHeaders(req) })

  } catch (err: any) {
    console.error('Command GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: getCorsHeaders(req) })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const key = authHeader(req, body)
    const { agent_id, command_type, payload } = body

    // If called from SDK (connect_key auth), keep existing behavior
    if (key) {
      const auth = await authorizeSdkAgent(key, agent_id)
      if (hasError(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: getCorsHeaders(req) })

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
      return NextResponse.json({ success: true, command_id: command.id }, { headers: getCorsHeaders(req) })
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
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: getCorsHeaders(req) })
    }

    const auth = await authorizeSdkAgent(key, agent_id)
    if (hasError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: getCorsHeaders(req) })
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
      return NextResponse.json({ error: 'Command not found or unavailable' }, { status: 404, headers: getCorsHeaders(req) })
    }

    return NextResponse.json({ success: true }, { headers: getCorsHeaders(req) })

  } catch (err: any) {
    console.error('Command PATCH error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: getCorsHeaders(req) })
  }
}
