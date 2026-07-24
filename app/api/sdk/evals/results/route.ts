import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey, ownsAgent } from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, name, passed, tool_matches, tokens_used, latency_ms, error_message, semantic_scores, agent_version, eval_set_id } = body

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { userId, supabaseAdmin, plan } = auth

    if (plan !== 'studio') {
      return NextResponse.json({ error: "Evals require Studio plan." }, { status: 403 })
    }

    if (!(await ownsAgent(supabaseAdmin!, agent_id, userId))) {
      return NextResponse.json({ error: 'Unauthorized agent access' }, { status: 403 })
    }

    // 1. Resolve Eval Set
    let resolvedSetId = eval_set_id;

    if (eval_set_id) {
      // A caller-supplied set id must belong to the agent we just authorized
      const { data: set } = await supabaseAdmin!
        .from('agent_eval_sets')
        .select('agent_id')
        .eq('id', eval_set_id)
        .maybeSingle()

      if (!set || set.agent_id !== agent_id) {
        return NextResponse.json({ error: 'Unauthorized eval set access' }, { status: 403 })
      }
    }

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
