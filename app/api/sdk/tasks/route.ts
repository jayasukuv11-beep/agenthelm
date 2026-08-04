import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey, type AuthResult, hasError } from '@/lib/sdk-auth'
import { resolveProject } from '@/lib/project-resolver'

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const project = searchParams.get('project')

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    const auth: AuthResult = await validateConnectKey(key)
    if (hasError(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin, userId } = auth

    // Resolve project
    let projectId: string | null = null
    if (project) {
      const { data: projectRecord } = await resolveProject(supabaseAdmin, project)
      projectId = projectRecord?.id || null
    }

    // Get tasks for this user (and project if specified)
    let query = supabaseAdmin
      .from('agent_tasks')
      .select(`
        id,
        task_description,
        status,
        source,
        created_at,
        started_at,
        completed_at,
        agent_id,
        agents!inner(name, agent_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (projectId) {
      query = query.eq('agents.project_id', projectId)
    }

    const { data: tasks, error } = await query

    if (error) throw error

    // For each task, get the latest checkpoint
    const tasksWithCheckpoints = await Promise.all(
      (tasks || []).map(async (task: any) => {
        const { data: checkpoints } = await supabaseAdmin
          .from('agent_checkpoints')
          .select('step_index, step_name, status, state_snapshot, output_data, updated_at')
          .eq('task_id', task.id)
          .eq('status', 'completed')
          .order('step_index', { ascending: false })
          .limit(1)

        return {
          ...task,
          latest_checkpoint: checkpoints?.[0] || null
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithCheckpoints })
  } catch (err) {
    console.error('Tasks API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}