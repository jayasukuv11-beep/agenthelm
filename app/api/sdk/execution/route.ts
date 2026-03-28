import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

// ─── POST: Register a tool execution (creates pending_approval for irreversible) ──

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      key,
      agent_id,
      task_id,
      tool_name,
      classification,
      idempotency_key,
      input_hash,
      input_preview,
      confirm_channel = 'telegram',
      retry_count = 0,
      max_retries = 3,
      status = 'executed',
    } = body

    if (!tool_name || !classification) {
      return NextResponse.json(
        { error: 'tool_name and classification are required' },
        { status: 400 }
      )
    }

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin, agentId: jwtAgentId } = auth as any

    // Verify agent belongs to user
    if (!jwtAgentId || jwtAgentId !== agent_id) {
      const { data: agent } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single()

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
      }
    }

    // For irreversible: check if approval already exists for this input_hash
    if (classification === 'irreversible' && input_hash) {
      const { data: existing } = await supabaseAdmin!
        .from('tool_executions')
        .select('id, status')
        .eq('agent_id', agent_id)
        .eq('input_hash', input_hash)
        .in('status', ['pending_approval', 'approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (existing && existing.length > 0) {
        // Already have a record — return its current status
        return NextResponse.json({
          execution_id: existing[0].id,
          status: existing[0].status,
          already_exists: true,
        })
      }
    }

    // Insert the tool execution
    const { data: execution, error } = await supabaseAdmin!
      .from('tool_executions')
      .insert({
        agent_id,
        task_id: task_id || null,
        tool_name,
        classification,
        idempotency_key: idempotency_key || null,
        input_hash: input_hash || null,
        input_preview: input_preview || null,
        confirm_channel,
        retry_count,
        max_retries,
        status,
      })
      .select('id, status')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      execution_id: execution.id,
      status: execution.status,
    })

  } catch (err: unknown) {
    console.error('Execution POST error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── GET: Check status of a tool execution (used by SDK polling for approval) ──

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const agent_id = searchParams.get('agent_id')
    const input_hash = searchParams.get('input_hash')
    const execution_id = searchParams.get('execution_id')

    if (!agent_id && !execution_id) {
      return NextResponse.json(
        { error: 'agent_id or execution_id is required' },
        { status: 400 }
      )
    }

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth as any

    let query = supabaseAdmin!
      .from('tool_executions')
      .select('id, status, tool_name, classification, input_preview, created_at')

    if (execution_id) {
      query = query.eq('id', execution_id)
    } else {
      query = query.eq('agent_id', agent_id)
      if (input_hash) {
        query = query.eq('input_hash', input_hash)
      }
      query = query.order('created_at', { ascending: false })
    }

    const { data: executions, error } = await query.limit(1)

    if (error) throw error

    const execution = executions?.[0] || null

    return NextResponse.json({
      status: execution?.status || 'not_found',
      execution,
    })

  } catch (err: unknown) {
    console.error('Execution GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── PATCH: Approve or reject an irreversible tool execution ──

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const body = await req.json()
    const { execution_id, status } = body

    if (!execution_id || !status) {
      return NextResponse.json(
        { error: 'execution_id and status are required' },
        { status: 400 }
      )
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth as any

    const { data, error } = await supabaseAdmin!
      .from('tool_executions')
      .update({ status })
      .eq('id', execution_id)
      .eq('status', 'pending_approval')  // Only update if still pending
      .select('id, status')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      execution_id: data.id,
      status: data.status,
    })

  } catch (err: unknown) {
    console.error('Execution PATCH error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
