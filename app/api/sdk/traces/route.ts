import { NextResponse } from 'next/server';
import { validateConnectKey, hasError } from '../../../../lib/sdk-auth';

export const dynamic = 'force-dynamic';

// The trace route joins tasks, tool executions, and checkpoints
// for the visual Timeline view and Studio export.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agent_id = searchParams.get('agent_id');
    const task_id = searchParams.get('task_id');
    
    const authHeader = req.headers.get('authorization');
    const connectKey = authHeader ? authHeader.replace('Bearer ', '') : (req.headers.get('x-connect-key') || searchParams.get('key'));

    const auth = await validateConnectKey(connectKey);
    if (hasError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { userId, supabaseAdmin } = auth;

    if (task_id) {
      // Return a full trace for a specific task
      const [taskReq, toolsReq, checksReq, reasoningReq] = await Promise.all([
        supabaseAdmin.from('agent_tasks').select('*').eq('id', task_id).single(),
        supabaseAdmin.from('tool_executions').select('*').eq('task_id', task_id).order('created_at', { ascending: true }),
        supabaseAdmin.from('agent_checkpoints').select('*').eq('task_id', task_id).order('step_index', { ascending: true }),
        supabaseAdmin.from('agent_reasoning_steps').select('*').eq('task_id', task_id).order('step_index', { ascending: true })
      ]);

      if (taskReq.error || !taskReq.data) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

      // Verify that the task belongs to the authenticated user
      if (taskReq.data.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized task access' }, { status: 403 });
      }

      // Join tool executions and checkpoints loosely by looking at timestamps or step sequence.
      // For now, we just return them all and let the client dashboard align them.
      return NextResponse.json({
        task: taskReq.data,
        tool_executions: toolsReq.data || [],
        checkpoints: checksReq.data || [],
        reasoning_steps: reasoningReq.data || []
      });
    }

    if (agent_id) {
      // Verify that the agent belongs to the authenticated user
      const { data: agent, error: agentErr } = await supabaseAdmin
        .from('agents')
        .select('user_id')
        .eq('id', agent_id)
        .single();

      if (agentErr || !agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      if (agent.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized agent access' }, { status: 403 });
      }

      // Basic free tier limits to 5, indie to 100 for now.
      // Real implementation would look up user's plan. Assume 100 max for UI.
      const limit = Number(searchParams.get('limit') || '50');
      
      const { data, error } = await supabaseAdmin
        .from('agent_tasks')
        .select('*')
        .eq('agent_id', agent_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ tasks: data });
    }

    return NextResponse.json({ error: 'Must provide agent_id or task_id' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
