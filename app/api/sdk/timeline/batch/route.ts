import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

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
    const authHeader = req.headers.get('authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const body = await req.json().catch(() => ({}))
    
    if (!token && body.key) token = body.key

    const auth: any = await validateConnectKey(token)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin, agentId } = auth as any
    const { project, events } = body

    if (!project || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or empty events array' }, { status: 400 })
    }

    // 1. Resolve project_id
    const { data: projectRecord } = await supabaseAdmin
      .from('projects')
      .select('id')
      .or(`id.eq.${project},name.eq.${project}`)
      .limit(1)
      .single()

    if (!projectRecord) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Format batch for insertion
    const timelineEvents = events.map(event => ({
      project_id: projectRecord.id,
      agent_id: agentId,
      event_type: event.event_type || 'custom',
      title: event.title || 'Agent Event',
      details: event.details || {},
      created_at: event.timestamp || new Date().toISOString()
    }))

    // 3. Batch insert
    const { error: insertError } = await supabaseAdmin
      .from('ai_timeline_events')
      .insert(timelineEvents)

    if (insertError) throw insertError

    return NextResponse.json({ success: true, count: timelineEvents.length })

  } catch (err) {
    console.error('Timeline batch error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
