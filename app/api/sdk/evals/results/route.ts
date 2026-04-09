import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, name, passed, tool_matches, tokens_used, latency_ms, error_message, semantic_scores } = body

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabaseAdmin, plan } = auth

    if (plan !== 'studio') {
      return NextResponse.json({ error: "Evals require Studio plan." }, { status: 403 })
    }

    // 1. Upsert Eval Set (for UI golden list)
    let evalSetId = null;
    const { data: existingSet } = await supabaseAdmin!
      .from('agent_eval_sets')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('name', name)
      .maybeSingle()

    if (existingSet) {
      evalSetId = existingSet.id;
    } else {
      const { data: newSet } = await supabaseAdmin!
        .from('agent_eval_sets')
        .insert({
          agent_id: agent_id,
          name: name,
          input_data: {}, // Handled by UI/SDK registry
        })
        .select('id')
        .single()
      if (newSet) evalSetId = newSet.id;
    }

    // 2. Insert Eval Result
    const { error: insertError } = await supabaseAdmin!
      .from('agent_eval_results')
      .insert({
        eval_set_id: evalSetId,
        agent_id: agent_id,
        passed,
        tool_matches,
        semantic_scores: semantic_scores || null,
        tokens_used: tokens_used || 0,
        latency_ms: latency_ms || 0,
        error_message: error_message || null
      })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Eval Result Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
