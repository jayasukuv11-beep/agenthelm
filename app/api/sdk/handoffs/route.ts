import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import {
  authorizeSdkAgent,
  authorizeSdkTask,
  hasError,
} from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const {
      key,
      agent_id,
      task_id,
      to_agent_id,
      payload,
      status
    } = await req.json()

    if (!key || !agent_id || !to_agent_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const authResult = await authorizeSdkAgent(key, agent_id)
    if (hasError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    if (task_id) {
      const task = await authorizeSdkTask(authResult, task_id)
      if ('error' in task) {
        return NextResponse.json({ error: task.error }, { status: task.status })
      }
    }

    const { data: targetAgent } = await authResult.supabaseAdmin
      .from('agents')
      .select('id, project_id')
      .eq('id', to_agent_id)
      .eq('user_id', authResult.userId)
      .single()

    if (!targetAgent || targetAgent.project_id !== authResult.agent.project_id) {
      return NextResponse.json({ error: 'Target agent not found or unauthorized' }, { status: 403 })
    }

    // Insert handoff
    const { error: insertError } = await authResult.supabaseAdmin
      .from('agent_handoffs')
      .insert({
        from_agent_id: agent_id,
        to_agent_id,
        task_id,
        payload,
        status: status || 'pending'
      })

    if (insertError) {
      console.error('[API] Error inserting handoff:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[API] Handoff ingestion error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')
    const key = searchParams.get('key')

    if (!key || !agent_id) {
      return NextResponse.json({ error: 'Missing key or agent_id' }, { status: 400 })
    }

    const authResult = await authorizeSdkAgent(key, agent_id)
    if (hasError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Fetch handoffs where agent is either sender or receiver
    const { data: handoffs, error } = await authResult.supabaseAdmin
      .from('agent_handoffs')
      .select('*, from_agent:from_agent_id(name), to_agent:to_agent_id(name)')
      .or(`from_agent_id.eq.${agent_id},to_agent_id.eq.${agent_id}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ handoffs })

  } catch (err: any) {
    console.error('[API] Handoff fetch error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
