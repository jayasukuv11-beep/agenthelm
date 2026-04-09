import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { validateConnectKey } from '@/lib/sdk-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    const authResult = await validateConnectKey(key)

    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    if ('agentId' in authResult && authResult.agentId && authResult.agentId !== agent_id) {
      return NextResponse.json({ error: 'Mismatched connect key for this agent' }, { status: 401 })
    }

    // Insert handoff
    const { error: insertError } = await supabase
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

    const authResult = await validateConnectKey(key)

    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    if ('agentId' in authResult && authResult.agentId && authResult.agentId !== agent_id) {
      return NextResponse.json({ error: 'Mismatched connect key for this agent' }, { status: 401 })
    }

    // Fetch handoffs where agent is either sender or receiver
    const { data: handoffs, error } = await supabase
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
