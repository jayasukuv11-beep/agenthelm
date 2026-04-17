import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'

function generateHeuristicRubric(toolSequence: string[], reasoningSteps: any[]) {
  const criteria = [];

  // Always include task completion
  criteria.push({
    name: "task_completion",
    description: "Did the agent complete the task and produce an output?",
    weight: 0.4
  });

  // If tools were used, add tool accuracy criterion
  if (toolSequence.length > 0) {
    criteria.push({
      name: "tool_usage_accuracy",
      description: `Agent should use these tools in sequence: ${toolSequence.join(" → ")}`,
      weight: 0.3
    });
  }

  // If reasoning steps exist, add reasoning quality criterion
  if (reasoningSteps.length > 0) {
    criteria.push({
      name: "reasoning_quality",
      description: "Agent should demonstrate clear step-by-step reasoning",
      weight: 0.2
    });
  }

  // Always include output quality
  criteria.push({
    name: "output_quality",
    description: "Output should be structured, relevant, and complete",
    weight: toolSequence.length > 0 ? 0.1 : 0.3
  });

  return criteria;
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { task_id, name, agent_id, key } = body

    if (!task_id || !agent_id) {
      return NextResponse.json({ error: 'task_id and agent_id are required' }, { status: 400 })
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabaseAdmin } = auth

    // 1. Fetch checkpoints
    const { data: checkpoints, error: cpError } = await supabaseAdmin
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

    // 2. Fetch tool sequence
    const { data: toolExecs, error: toolError } = await supabaseAdmin
      .from('tool_executions')
      .select('tool_name')
      .eq('task_id', task_id)
      .order('created_at', { ascending: true })

    if (toolError) throw toolError
    const toolSequence = toolExecs?.map((t: any) => t.tool_name) || []

    // 3. Fetch reasoning steps
    const { data: reasoningSteps, error: reasoningError } = await supabaseAdmin
      .from('agent_reasoning_steps')
      .select('*')
      .eq('task_id', task_id)
      .order('step_index', { ascending: true })

    if (reasoningError) throw reasoningError

    // 4. Generate Rubric
    const judgeRubric = generateHeuristicRubric(toolSequence, reasoningSteps || [])

    // 5. Insert into agent_eval_sets
    const { data: evalSet, error: insertError } = await supabaseAdmin
      .from('agent_eval_sets')
      .insert({
        agent_id,
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

  } catch (err: any) {
    console.error('From-Trace Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
