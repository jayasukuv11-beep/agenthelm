import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'
import crypto from 'crypto'

const checkpointPostSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().min(1),
  step_index: z.number().int().min(0),
  step_name: z.string().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('completed'),
  state_snapshot: z.any().optional(),
  state_delta: z.any().optional(),
  state_hash: z.string().optional(),
  input_data: z.any().optional(),
  output_data: z.any().optional(),
  tokens_used: z.number().int().min(0).default(0),
  latency_ms: z.number().int().min(0).optional(),
  error_data: z.any().optional(),
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: checkpointPostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const {
      task_id,
      step_index,
      step_name,
      status = 'completed',
      state_snapshot,
      state_delta,
      state_hash,
      input_data,
      output_data,
      tokens_used = 0,
      latency_ms,
      error_data,
    } = body

    // Cap state_snapshot size to 500KB
    if (state_snapshot) {
      const bytes = new TextEncoder().encode(JSON.stringify(state_snapshot)).length
      if (bytes > 500_000) {
        return NextResponse.json(
          { error: 'state_snapshot_too_large', max_bytes: 500_000 },
          { status: 413 }
        )
      }
    }

    if (state_delta) {
      const deltaBytes = new TextEncoder().encode(JSON.stringify(state_delta)).length
      if (deltaBytes > 500_000) {
        return NextResponse.json(
          { error: 'state_delta exceeds 500KB limit' },
          { status: 413 }
        )
      }
    }

    // Ensure task exists
    const { data: taskExists } = await supabase
      .from('agent_tasks')
      .select('id')
      .eq('id', task_id)
      .maybeSingle()

    if (!taskExists) {
      const { error: taskError } = await supabase
        .from('agent_tasks')
        .insert({
          id: task_id,
          agent_id: agentId,
          user_id: userId,
          task_description: step_name || 'Local Task',
          status: 'running',
          source: 'dashboard',
          started_at: new Date().toISOString()
        })
      if (taskError) {
        console.error('[Checkpoint Route] Task creation failed:', taskError)
        return NextResponse.json({ error: taskError.message }, { status: 400 })
      }
    }

    // Upsert checkpoint
    const { data: existing } = await supabase
      .from('agent_checkpoints')
      .select('id')
      .eq('task_id', task_id)
      .eq('step_index', step_index)
      .limit(1)

    const row = {
      task_id,
      agent_id: agentId,
      step_index,
      step_name: step_name || null,
      status,
      state_snapshot: state_snapshot || null,
      state_delta: state_delta || null,
      input_data: input_data || null,
      output_data: output_data || null,
      tokens_used,
      latency_ms: latency_ms || null,
      error_data: error_data || null,
      state_hash: state_hash || null,
    }

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('agent_checkpoints')
        .update(row)
        .eq('id', existing[0].id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('agent_checkpoints')
        .insert(row)

      if (error) throw error
    }

    if (status === 'running') {
      await supabase
        .from('agent_tasks')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', task_id)
        .in('status', ['pending', 'running'])
    }

    if (status === 'failed') {
      await supabase
        .from('agent_tasks')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', task_id)
    }

    return NextResponse.json({ success: true, step_index })
  }
)

export const GET = withSdkAuth(
  {
    isWrite: false
  },
  async (ctx, req) => {
    const { supabase } = ctx
    const { searchParams } = new URL(req.url)
    const task_id = searchParams.get('task_id')
    const step_index = searchParams.get('step_index')

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    let query = supabase
      .from('agent_checkpoints')
      .select('*')
      .eq('task_id', task_id)
      .eq('status', 'completed')
      .order('step_index', { ascending: false })

    if (step_index !== null && step_index !== undefined) {
      const parsedStep = parseInt(step_index, 10)
      if (Number.isInteger(parsedStep) && parsedStep >= 0) {
        query = query.eq('step_index', parsedStep)
      }
    }

    const { data: checkpoints, error } = await query.limit(1)
    if (error) throw error
    const checkpoint = checkpoints?.[0]

    let integrityVerified = true
    if (checkpoint && checkpoint.state_snapshot && checkpoint.state_hash) {
      const computedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(checkpoint.state_snapshot))
        .digest('hex')

      integrityVerified = computedHash === checkpoint.state_hash
    }

    return NextResponse.json({
      checkpoint,
      has_checkpoint: !!checkpoint,
      integrity_verified: integrityVerified,
    })
  }
)
