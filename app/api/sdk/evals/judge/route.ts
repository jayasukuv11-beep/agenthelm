import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { callSarvamText } from '@/lib/llm/sarvam-text'
import { z } from 'zod'

const evalsJudgeSchema = z.object({
  agent_id: z.string().uuid().optional(),
  output: z.any().optional(),
  judge_rubric: z.record(z.string(), z.any()),
  judge_model: z.string().optional()
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: evalsJudgeSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { body } = ctx
    const { output, judge_rubric } = body

    if (!judge_rubric || Object.keys(judge_rubric).length === 0) {
      return NextResponse.json({ error: 'Missing judge_rubric' }, { status: 400 })
    }

    const semantic_scores: Record<string, number> = {}

    for (const [criterion, description] of Object.entries(judge_rubric)) {
      try {
        const prompt = `You are an evaluation judge. Score this agent output.
        
Rubric criterion: ${criterion} - ${description}
Actual output: ${JSON.stringify(output)}

Respond with ONLY valid JSON in this exact format:
{
  "passed": true or false,
  "score": 0.0 to 1.0,
  "reasoning": "one sentence explanation"
}`

        const result = await callSarvamText(prompt, { maxTokens: 512 })
        if (!result) throw new Error('Sarvam API error')

        const content = result.text
        const jsonMatch = content.match(/\{[\s\S]*?\}/)
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content)
        
        semantic_scores[criterion] = parseFloat((parsed.score || 0).toFixed(2))
      } catch (err) {
        console.error(`Judge failed for criterion ${criterion}:`, err)
        semantic_scores[criterion] = 0
      }
    }

    return NextResponse.json({ 
      success: true, 
      semantic_scores 
    })
  }
)
