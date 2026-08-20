import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { z } from 'zod'

const fromTracePostSchema = z.object({
  task_id: z.string().min(1),
  agent_id: z.string().uuid(),
  name: z.string().optional()
})

function generateHeuristicRubric(toolSequence: string[], reasoningSteps: any[]) {
  const criteria = []

  criteria.push({
    name: "task_completion",
    description: "Did the agent complete the task and produce an output?",
    weight: 0.4
  })

  if (toolSequence.length > 0) {
    criteria.push({
      name: "tool_usage_accuracy",
      description: `Agent should use these tools in sequence: ${toolSequence.join(" → ")}`,
      weight: 0.3
    })
  }

  if (reasoningSteps.length > 0) {
    criteria.push({
      name: "reasoning_quality",
      description: "Agent should demonstrate clear step-by-step reasoning",
      weight: 0.2
    })
  }

  criteria.push({
    name: "output_quality",
    description: "Output should be structured, relevant, and complete",
    weight: toolSequence.length > 0 ? 0.1 : 0.3
  })

  return criteria
}

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: fromTracePostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body } = ctx
    const { task_id, name } = body

    const { data: checkpoints, error: cpError } = await supabase
      .from('agent_checkpoints')
      .select('*')
      .eq('task_id', task_id)
      .order('step_index', { ascending: true })

    if (cpError) throw cpError
    if (!checkpoints || checkpoints.length === 0) {
      return NextResponse.json({ error: 'No checkpoints found for this task' }, { status: 404 })
    }

    const inputData = checkpoints[0].input_data || {}
    const outputData = checkpoints[checkpoints.length - 1].output_data || checkpoints[checkpoints.length - 1].state_snapshot || {}

    const { data: toolExecs, error: toolError } = await supabase
      .from('tool_executions')
      .select('tool_name')
      .eq('task_id', task_id)
      .order('created_at', { ascending: true })

    if (toolError) throw toolError
    const toolSequence = toolExecs?.map((t: any) => t.tool_name) || []

    const { data: reasoningSteps, error: reasoningError } = await supabase
      .from('agent_reasoning_steps')
      .select('*')
      .eq('task_id', task_id)
      .order('step_index', { ascending: true })

    if (reasoningError) throw reasoningError

    const judgeRubric = generateHeuristicRubric(toolSequence, reasoningSteps || [])

    const { data: evalSet, error: insertError } = await supabase
      .from('agent_eval_sets')
      .insert({
        agent_id: agentId,
        name: name || `Trace Eval: ${task_id.slice(0, 8)}`,
        input_data: inputData,
        expected_output: JSON.stringify(outputData),
        expected_tools: toolSequence,
        judge_rubric: judgeRubric,
        auto_generated: true,
        source_task_id: task_id
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, eval_set: evalSet })
  }
)
