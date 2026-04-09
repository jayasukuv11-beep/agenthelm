import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { validateConnectKey } from '@/lib/sdk-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    if (!key || !agent_id || !task_id || !step_index) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const authResult = await validateConnectKey(key)

    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    
    // If it's a JWT from an agent, agentId must match the payload
    if ('agentId' in authResult && authResult.agentId && authResult.agentId !== agent_id) {
      return NextResponse.json({ error: 'Mismatched connect key for this agent' }, { status: 401 })
    }

    // Insert reasoning step
    const { error: insertError } = await supabase
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
