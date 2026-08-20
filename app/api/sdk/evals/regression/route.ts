import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const regressionPostSchema = z.object({
  eval_set_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  current_version: z.string().min(1),
  baseline_version: z.string().min(1),
  threshold: z.number().optional().default(0.10)
})

const regressionPatchSchema = z.object({
  regression_id: z.string().uuid()
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: regressionPostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body } = ctx
    const { eval_set_id, current_version, baseline_version, threshold = 0.10 } = body

    const { data: currentResult } = await supabase
      .from('agent_eval_results')
      .select('*')
      .eq('eval_set_id', eval_set_id)
      .eq('agent_version', current_version)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: baselineResult } = await supabase
      .from('agent_eval_results')
      .select('*')
      .eq('eval_set_id', eval_set_id)
      .eq('agent_version', baseline_version)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!currentResult || !baselineResult) {
      return NextResponse.json({ 
        regression_detected: false, 
        message: 'Could not find results for both versions to compare' 
      })
    }

    const regressions = []
    const currentPass = currentResult.passed ? 1 : 0
    const baselinePass = baselineResult.passed ? 1 : 0
    const passDelta = currentPass - baselinePass

    if (passDelta < -0.1) {
      regressions.push({
        agent_id: agentId,
        eval_set_id,
        baseline_version,
        current_version,
        metric: 'pass_rate',
        baseline_value: baselinePass,
        current_value: currentPass,
        delta: passDelta,
        threshold_used: threshold
      })
    }

    const getAvgScore = (scores: any) => {
      if (!scores || Object.keys(scores).length === 0) return 0
      const vals = Object.values(scores) as number[]
      return vals.reduce((a, b) => a + b, 0) / vals.length
    }

    const currentScore = getAvgScore(currentResult.semantic_scores)
    const baselineScore = getAvgScore(baselineResult.semantic_scores)
    const scoreDelta = currentScore - baselineScore

    if (scoreDelta < -threshold) {
      regressions.push({
        agent_id: agentId,
        eval_set_id,
        baseline_version,
        current_version,
        metric: 'semantic_score',
        baseline_value: baselineScore,
        current_value: currentScore,
        delta: scoreDelta,
        threshold_used: threshold
      })
    }

    if (regressions.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('eval_regressions')
        .insert(regressions)
        .select()

      if (insertError) throw insertError

      return NextResponse.json({ 
        regression_detected: true, 
        regressions: inserted 
      })
    }

    return NextResponse.json({ regression_detected: false })
  }
)

export const GET = withSdkAuth(
  {
    isWrite: false
  },
  async (ctx, req) => {
    const { supabase } = ctx
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')

    if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

    const { data: regressions, error } = await supabase
      .from('eval_regressions')
      .select('*, agent_eval_sets(name)')
      .eq('agent_id', agent_id)
      .order('acknowledged', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(regressions)
  }
)

export const PATCH = withSdkAuth(
  {
    schema: regressionPatchSchema,
    isWrite: true
  },
  async (ctx) => {
    const { supabase, body } = ctx
    const { regression_id } = body

    const { error } = await supabase
      .from('eval_regressions')
      .update({ acknowledged: true })
      .eq('id', regression_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  }
)
