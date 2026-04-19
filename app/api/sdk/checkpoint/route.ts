import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'
import crypto from 'crypto'

// Handle CORS preflight
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

// ─── POST: Save a checkpoint ──────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      key,
      agent_id,
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

    if (!task_id || step_index === undefined || step_index === null) {
      return NextResponse.json(
        { error: 'task_id and step_index are required' },
        { status: 400 }
      )
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin, agentId: jwtAgentId } = auth as any

    // Verify agent belongs to user
    if (!jwtAgentId || jwtAgentId !== agent_id) {
      const { data: agent } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single()

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
      }
    }

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

    // Cap state_delta size to 500KB
    const deltaSize = Buffer.byteLength(JSON.stringify(body.state_delta || {}))
    if (deltaSize > 500 * 1024) {
      return NextResponse.json(
        { error: 'state_delta exceeds 500KB limit' },
        { status: 413 }
      )
    }

    // Upsert checkpoint (task_id + step_index is the logical key)
    const { data: existing } = await supabaseAdmin!
      .from('agent_checkpoints')
      .select('id')
      .eq('task_id', task_id)
      .eq('step_index', step_index)
      .limit(1)

    const row = {
      task_id,
      agent_id,
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

    // Ensure task exists
    const { data: taskExists } = await supabaseAdmin!
      .from('agent_tasks')
      .select('id')
      .eq('id', task_id)
      .maybeSingle()

    if (!taskExists) {
      // Create a transient task for local execution tracking
      const { error: taskError } = await supabaseAdmin!
        .from('agent_tasks')
        .insert({
          id: task_id,
          agent_id,
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

    if (existing && existing.length > 0) {
      // Update existing checkpoint
      const { error } = await supabaseAdmin!
        .from('agent_checkpoints')
        .update(row)
        .eq('id', (existing[0] as any).id)

      if (error) {
         console.error('[Checkpoint Route] Update failed:', error)
         throw error
      }
    } else {
      // Insert new checkpoint
      const { error } = await supabaseAdmin!
        .from('agent_checkpoints')
        .insert(row)

      if (error) {
         console.error('[Checkpoint Route] Insert failed:', error)
         throw error
      }
    }

    // If checkpoint status is 'running', mark the task as running too
    if (status === 'running') {
      await supabaseAdmin!
        .from('agent_tasks')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', task_id)
        .in('status', ['pending', 'running'])
    }

    // If checkpoint failed, mark the task as failed
    if (status === 'failed') {
      await supabaseAdmin!
        .from('agent_tasks')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', task_id)
    }

    return NextResponse.json({ success: true, step_index })

  } catch (err: unknown) {
    console.error('Checkpoint POST error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ─── GET: Retrieve last successful checkpoint for resume ──────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const task_id = searchParams.get('task_id')
    const step_index = searchParams.get('step_index')

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth as any

    let query = supabaseAdmin!
      .from('agent_checkpoints')
      .select('*')
      .eq('task_id', task_id)
      .eq('status', 'completed')
      .order('step_index', { ascending: false })

    if (step_index) {
      // Get a specific step
      query = query.eq('step_index', parseInt(step_index, 10))
    }

    const { data: checkpoints, error } = await query.limit(1)

    if (error) throw error

    let integrityVerified = true
    if (checkpoint && checkpoint.state_snapshot && checkpoint.state_hash) {
      const computedHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(checkpoint.state_snapshot))
        .digest('hex')

      integrityVerified = computedHash === checkpoint.state_hash
      
      if (!integrityVerified) {
        // Log corrupted state to agent_logs
        await supabaseAdmin
          .from('agent_logs')
          .insert({
            agent_id: checkpoint.agent_id,
            task_id,
            type: 'error',
            level: 'error',
            message: `Corrupted checkpoint detected at step ${checkpoint.step_index}. Hash mismatch.`,
            metadata: { expected: checkpoint.state_hash, actual: computedHash }
          })
      }
    }

    return NextResponse.json({
      checkpoint,
      has_checkpoint: !!checkpoint,
      integrity_verified: integrityVerified,
    })

  } catch (err: unknown) {
    console.error('Checkpoint GET error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
