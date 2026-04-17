import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, name, passed, tool_matches, tokens_used, latency_ms, error_message, semantic_scores, agent_version, eval_set_id } = body

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabaseAdmin, plan } = auth

    if (plan !== 'studio') {
      return NextResponse.json({ error: "Evals require Studio plan." }, { status: 403 })
    }

    // 1. Resolve Eval Set
    let resolvedSetId = eval_set_id;
    
    if (!resolvedSetId && name) {
      const { data: existingSet } = await supabaseAdmin!
        .from('agent_eval_sets')
        .select('id')
        .eq('agent_id', agent_id)
        .eq('name', name)
        .maybeSingle()

      if (existingSet) {
        resolvedSetId = existingSet.id;
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
        if (newSet) resolvedSetId = newSet.id;
      }
    }

    if (!resolvedSetId) {
       return NextResponse.json({ error: "eval_set_id or name required" }, { status: 400 })
    }

    // 2. Insert Eval Result
    const { error: insertError } = await supabaseAdmin!
      .from('agent_eval_results')
      .insert({
        eval_set_id: resolvedSetId,
        agent_id: agent_id,
        passed,
        tool_matches,
        semantic_scores: semantic_scores || null,
        tokens_used: tokens_used || 0,
        latency_ms: latency_ms || 0,
        error_message: error_message || null,
        agent_version: agent_version || '1.0.0'
      })

    if (insertError) throw insertError

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Eval Result Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
