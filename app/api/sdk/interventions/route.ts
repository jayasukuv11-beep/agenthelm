import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

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
    const task_id = searchParams.get('task_id')

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin, agentId: jwtAgentId } = auth as any

    // Verify ownership
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

    // Fetch pending interventions for this task
    const { data: interventions, error } = await supabaseAdmin!
      .from('agent_interventions')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('task_id', task_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ interventions: interventions || [] })

  } catch (err: any) {
    console.error('Interventions GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, task_id, type, payload } = body

    // Support both SDK (connect key) and Dashboard (session) requests
    if (key) {
      const auth = await validateConnectKey(key)
      if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

      const { userId, supabaseAdmin } = auth as any
      const { data: agent } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single()

      if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

      // Create intervention
      const { data: intervention, error } = await supabaseAdmin!
        .from('agent_interventions')
        .insert({
          agent_id,
          task_id,
          type,
          payload: payload || {},
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, id: intervention.id })
    }

    // Dashboard UI call
    const supabase = createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', authData.user.id)
      .single()

    if (!agent) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    // If there is an intervention for this type/task already pending, mark it dismissed before adding a new one
    await supabase
      .from('agent_interventions')
      .update({ status: 'dismissed' })
      .eq('agent_id', agent_id)
      .eq('task_id', task_id)
      .eq('type', type)
      .eq('status', 'pending')

    const { data: intervention, error } = await supabase
      .from('agent_interventions')
      .insert({
        agent_id,
        task_id,
        type,
        payload: payload || {},
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: intervention.id })

  } catch (err: any) {
    console.error('Interventions POST error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Mark interventions as applied (called by SDK)
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const body = await req.json()
    const { ids } = body

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth as any

    const { error } = await supabaseAdmin!
      .from('agent_interventions')
      .update({ status: 'applied' })
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Interventions PATCH error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
