import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { resolveProject } from '@/lib/project-resolver'

export const OPTIONS = handleSdkOptions

export const GET = withSdkAuth(
  {
    isWrite: false
  },
  async (ctx, req) => {
    const { supabase, userId } = ctx
    const { searchParams } = new URL(req.url)
    const project = searchParams.get('project')

    let projectId: string | null = null
    if (project) {
      const { data: projectRecord } = await resolveProject(supabase, project)
      projectId = projectRecord?.id || null
    }

    let query = supabase
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

    const tasksWithCheckpoints = await Promise.all(
      (tasks || []).map(async (task: any) => {
        const { data: checkpoints } = await supabase
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
  }
)