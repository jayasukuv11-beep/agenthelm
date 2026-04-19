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

    const semantic_scores: Record<string, number> = {}

    for (const [criterion, description] of Object.entries(judge_rubric)) {
      try {
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBLtJbWM0NbIXi4KwI6e-pT-wDTfT6ex_c'
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an evaluation judge. Score this agent output.
              
Rubric criterion: ${criterion} - ${description}
Actual output: ${JSON.stringify(output)}

Respond with ONLY valid JSON in this exact format:
{
  "passed": true or false,
  "score": 0.0 to 1.0,
  "reasoning": "one sentence explanation"
}`
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        })

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`)
        }

        const result = await response.json()
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        
        // Try to extract JSON if Gemini somehow wraps it in markdown despite responseMimeType
        const jsonMatch = content.match(/\{[\s\S]*?\}/)
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
        
        semantic_scores[criterion] = parseFloat((parsed.score || 0).toFixed(2))
      } catch (err) {
        console.error(`Judge failed for criterion ${criterion}:`, err)
        semantic_scores[criterion] = 0 // Explicit error state scoring
      }
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
