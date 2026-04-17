import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eval_set_id, agent_id, current_version, baseline_version, threshold = 0.10, key } = body

    if (!eval_set_id || !agent_id || !current_version || !baseline_version) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabaseAdmin } = auth

    // 1. Fetch latest result for current version
    const { data: currentResult, error: currentError } = await supabaseAdmin
      .from('agent_eval_results')
      .select('*')
      .eq('eval_set_id', eval_set_id)
      .eq('agent_version', current_version)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 2. Fetch latest result for baseline version
    const { data: baselineResult, error: baselineError } = await supabaseAdmin
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

    // Compare pass rate (binary 1 or 0)
    const currentPass = currentResult.passed ? 1 : 0
    const baselinePass = baselineResult.passed ? 1 : 0
    const passDelta = currentPass - baselinePass

    if (passDelta < -0.1) { // If it flipped from pass to fail
       regressions.push({
         agent_id,
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

    // Compare average semantic scores
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
         agent_id,
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

    // 3. Insert regressions if any detected
    if (regressions.length > 0) {
      const { data: inserted, error: insertError } = await supabaseAdmin
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

  } catch (err: any) {
    console.error('Regression POST Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')
    const key = searchParams.get('key')

    if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

    const auth: any = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth

    const { data: regressions, error } = await supabaseAdmin
      .from('eval_regressions')
      .select('*, agent_eval_sets(name)')
      .eq('agent_id', agent_id)
      .order('acknowledged', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(regressions)

  } catch (err: any) {
    console.error('Regression GET Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { regression_id, key } = body

    if (!regression_id) return NextResponse.json({ error: 'regression_id required' }, { status: 400 })

    const auth: any = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth

    const { error } = await supabaseAdmin
      .from('eval_regressions')
      .update({ acknowledged: true })
      .eq('id', regression_id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Regression PATCH Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
