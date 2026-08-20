import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const interventionPostSchema = z.object({
  agent_id: z.string().uuid().optional(),
  task_id: z.string().optional(),
  type: z.string().min(1),
  payload: z.any().optional()
})

const interventionPatchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1)
})

export const OPTIONS = handleSdkOptions

export const GET = withSdkAuth(
  {
    isWrite: false
  },
  async (ctx, req) => {
    const { supabase, userId } = ctx
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')
    const task_id = searchParams.get('task_id')

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agent_id)
      .eq('user_id', userId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
    }

    let query = supabase
      .from('agent_interventions')
      .select('*')
      .eq('agent_id', agent_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (task_id) {
      query = query.eq('task_id', task_id)
    }

    const { data: interventions, error } = await query
    if (error) throw error

    return NextResponse.json({ interventions: interventions || [] })
  }
)

export const POST = withSdkAuth(
  {
    schema: interventionPostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body } = ctx
    const { task_id, type, payload } = body

    const { data: intervention, error } = await supabase
      .from('agent_interventions')
      .insert({
        agent_id: agentId,
        task_id: task_id || null,
        type,
        payload: payload || {},
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: intervention.id })
  }
)

export const PATCH = withSdkAuth(
  {
    schema: interventionPatchSchema,
    isWrite: true
  },
  async (ctx) => {
    const { supabase, userId, body } = ctx
    const { ids } = body

    const interventionCheck = await supabase
      .from('agent_interventions')
      .select('id, agent_id, agents!inner(user_id)')
      .in('id', ids)
      .eq('agents.user_id', userId)

    if (interventionCheck.data?.length !== ids.length) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('agent_interventions')
      .update({ status: 'applied' })
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ success: true })
  }
)
