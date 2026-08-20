import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const evalResultPostSchema = z.object({
  agent_id: z.string().uuid(),
  name: z.string().optional(),
  passed: z.boolean(),
  tool_matches: z.any().optional(),
  tokens_used: z.number().int().min(0).default(0),
  latency_ms: z.number().int().min(0).default(0),
  error_message: z.string().optional(),
  semantic_scores: z.record(z.string(), z.any()).optional(),
  agent_version: z.string().optional().default('1.0.0'),
  eval_set_id: z.string().uuid().optional(),
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: evalResultPostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body } = ctx
    const {
      name,
      passed,
      tool_matches,
      tokens_used,
      latency_ms,
      error_message,
      semantic_scores,
      agent_version,
      eval_set_id
    } = body

    let resolvedSetId = eval_set_id
    
    if (!resolvedSetId && name) {
      const { data: existingSet } = await supabase
        .from('agent_eval_sets')
        .select('id')
        .eq('agent_id', agentId)
        .eq('name', name)
        .maybeSingle()

      if (existingSet) {
        resolvedSetId = existingSet.id
      } else {
        const { data: newSet } = await supabase
          .from('agent_eval_sets')
          .insert({
            agent_id: agentId,
            name: name,
            input_data: {},
          })
          .select('id')
          .single()
        if (newSet) resolvedSetId = newSet.id
      }
    }

    if (!resolvedSetId) {
      return NextResponse.json({ error: "eval_set_id or name required" }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('agent_eval_results')
      .insert({
        eval_set_id: resolvedSetId,
        agent_id: agentId,
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
  }
)
