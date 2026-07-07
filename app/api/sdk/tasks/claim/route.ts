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

    const { userId, supabaseAdmin, agentId } = auth as any
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    // Check for existing running/pending task with same title
    // Including agents relation to get owner name
    const { data: existingTasks, error: checkError } = await supabaseAdmin
      .from('agent_tasks')
      .select('id, status, agent_id, agents(name)')
      .eq('user_id', userId)
      .eq('title', title)
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (checkError) throw checkError

    const existingTask = existingTasks?.[0]
    
    if (existingTask) {
      const ownerName = Array.isArray(existingTask.agents) 
        ? existingTask.agents[0]?.name 
        : (existingTask.agents as any)?.name || 'Unknown Agent'
        
      return NextResponse.json({ 
        claimed: false, 
        owner: ownerName 
      })
    }

    // Insert new task if not exists
    const { data: newTask, error: insertError } = await supabaseAdmin
      .from('agent_tasks')
      .insert({
        agent_id: agentId,
        user_id: userId,
        title: title,
        task_description: description || null,
        status: 'running',
        started_at: new Date().toISOString(),
        source: 'dashboard',
        // Optional fields that may exist depending on migration status
        claimed_by: agentId,
        assigned_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (insertError) {
        // Fallback insert without the newly mentioned columns if they haven't run migrations
        if (insertError.code === 'PGRST204' || (insertError.message && insertError.message.includes('claimed_by'))) {
            const { data: fallbackTask, error: fallbackError } = await supabaseAdmin
            .from('agent_tasks')
            .insert({
                agent_id: agentId,
                user_id: userId,
                title: title,
                task_description: description || null,
                status: 'running',
                started_at: new Date().toISOString(),
                source: 'dashboard'
            })
            .select('id')
            .single()

            if (fallbackError) throw fallbackError
            return NextResponse.json({ claimed: true, task_id: fallbackTask.id })
        }
        throw insertError
    }

    return NextResponse.json({ claimed: true, task_id: newTask.id })

  } catch (err) {
    console.error('Task claim error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
