import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, output, judge_rubric, judge_model } = body

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    if (auth.plan !== 'studio') {
      return NextResponse.json({ error: 'LLM-as-Judge requires Studio plan' }, { status: 403 })
    }

    if (!judge_rubric || Object.keys(judge_rubric).length === 0) {
      return NextResponse.json({ error: 'Missing judge_rubric' }, { status: 400 })
    }

    // In a production scenario, this is where we would call OpenAI:
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const completion = await openai.chat.completions.create({ ... })
    // For this build phase, we simulate the LLM output.
    
    const semantic_scores: Record<string, number> = {}
    
    for (const [criterion, description] of Object.entries(judge_rubric)) {
      // Dummy heuristic based on output length and a pseudo-random multiplier
      const lengthFactor = (output || "").length % 10
      const score = Math.min(1.0, 0.7 + (lengthFactor * 0.03)) 
      semantic_scores[criterion] = parseFloat(score.toFixed(2))
    }

    return NextResponse.json({ 
      success: true, 
      semantic_scores 
    })

  } catch (err: any) {
    console.error('Judge API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
