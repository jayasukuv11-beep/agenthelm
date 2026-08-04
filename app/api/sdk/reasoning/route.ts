import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import {
  authorizeSdkAgent,
  authorizeSdkTask,
  hasError,
} from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const { 
      key, 
      agent_id, 
      task_id,
      step_index,
      prompt_hash,
      prompt_summary,
      model_response_summary,
      decision,
      confidence,
      model,
      tokens_used,
      latency_ms
    } = await req.json()

    if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
      return NextResponse.json(
        { error: 'confidence must be between 0 and 1' },
        { status: 400 }
      )
    }

    if (!key || !agent_id || !task_id || !Number.isInteger(step_index) || step_index < 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const authResult = await authorizeSdkAgent(key, agent_id)

    if (hasError(authResult)) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const task = await authorizeSdkTask(authResult, task_id)
    if ('error' in task) {
      return NextResponse.json({ error: task.error }, { status: task.status })
    }

    // Insert reasoning step
    const { error: insertError } = await authResult.supabaseAdmin
      .from('agent_reasoning_steps')
      .insert({
        agent_id,
        task_id,
        step_index,
        prompt_hash,
        prompt_summary: prompt_summary?.substring(0, 500),
        model_response_summary: model_response_summary?.substring(0, 1000),
        decision,
        confidence,
        model,
        tokens_used,
        latency_ms
      })

    if (insertError) {
      console.error('[API] Error inserting reasoning step:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[API] Reasoning ingestion error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
