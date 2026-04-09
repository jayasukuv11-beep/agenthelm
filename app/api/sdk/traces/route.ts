import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// The trace route joins tasks, tool executions, and checkpoints
// for the visual Timeline view and Studio export.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agent_id = searchParams.get('agent_id');
    const task_id = searchParams.get('task_id');
    const userId = req.headers.get("x-user-id"); // In production, require Auth or a valid API key
    
    // Quick simple init using service role to bypass RLS for API ingestion/reading,
    // though typically you'd protect this endpoint with either an API key or session.
    // For this dashboard endpoint, we assume it's protected by middleware or the
    // front-end calls it with proper session. We'll use the regular client.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (task_id) {
      // Return a full trace for a specific task
      const [taskReq, toolsReq, checksReq, reasoningReq] = await Promise.all([
        supabase.from('agent_tasks').select('*').eq('id', task_id).single(),
        supabase.from('tool_executions').select('*').eq('task_id', task_id).order('created_at', { ascending: true }),
        supabase.from('agent_checkpoints').select('*').eq('task_id', task_id).order('step_index', { ascending: true }),
        supabase.from('agent_reasoning_steps').select('*').eq('task_id', task_id).order('step_index', { ascending: true })
      ]);

      if (taskReq.error) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

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
      // Basic free tier limits to 5, indie to 100 for now.
      // Real implementation would look up user's plan. Assume 100 max for UI.
      const limit = Number(searchParams.get('limit') || '50');
      
      const { data, error } = await supabase
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
