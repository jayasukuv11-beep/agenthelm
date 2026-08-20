import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'

export const OPTIONS = handleSdkOptions

export const GET = withSdkAuth(
  {
    isWrite: false
  },
  async (ctx, req) => {
    const { userId, supabase } = ctx
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')
    const task_id = searchParams.get('task_id')

    if (task_id) {
      const [taskReq, toolsReq, checksReq, reasoningReq] = await Promise.all([
        supabase.from('agent_tasks').select('*').eq('id', task_id).single(),
        supabase.from('tool_executions').select('*').eq('task_id', task_id).order('created_at', { ascending: true }),
        supabase.from('agent_checkpoints').select('*').eq('task_id', task_id).order('step_index', { ascending: true }),
        supabase.from('agent_reasoning_steps').select('*').eq('task_id', task_id).order('step_index', { ascending: true })
      ])

      if (taskReq.error || !taskReq.data) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

      if (taskReq.data.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized task access' }, { status: 403 })
      }

      return NextResponse.json({
        task: taskReq.data,
        tool_executions: toolsReq.data || [],
        checkpoints: checksReq.data || [],
        reasoning_steps: reasoningReq.data || []
      })
    }

    if (agent_id) {
      const { data: agent, error: agentErr } = await supabase
        .from('agents')
        .select('user_id')
        .eq('id', agent_id)
        .single()

      if (agentErr || !agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      if (agent.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized agent access' }, { status: 403 })
      }

      const limit = Number(searchParams.get('limit') || '50')
      
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('agent_id', agent_id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ tasks: data })
    }

    return NextResponse.json({ error: 'Must provide agent_id or task_id' }, { status: 400 })
  }
)
