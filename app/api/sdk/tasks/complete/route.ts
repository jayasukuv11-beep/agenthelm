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
    const { task_id } = body

    if (!task_id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('agent_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', task_id)
      .eq('agent_id', agentId) // Ensure they only complete tasks they own

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Task complete error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
