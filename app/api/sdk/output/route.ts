import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import type { SupabaseClient } from '@supabase/supabase-js'
import { validateConnectKey } from '@/lib/sdk-auth'
import { getCostPerToken } from '@/lib/pricing'
import { sendTelegramToUser } from '@/lib/telegram'

// ✅ USD to INR conversion
const USD_TO_INR = 84.5

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}



function formatOutputSummary(data: Record<string, unknown>, maxFields = 5): string {
  const entries = Object.entries(data)
    .filter(([, v]) => v !== undefined && v !== null)
    .slice(0, maxFields)
  if (entries.length === 0) return ''
  return entries
    .map(([k, v]: [string, any]) => {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v)
      return `${k}: ${val.length > 80 ? val.slice(0, 77) + '...' : val}`
    })
    .join('\n')
}

async function completeDispatchTask(args: {
  agent_id: string
  userId: string
  outputData: Record<string, unknown>
  supabaseAdmin: SupabaseClient
}) {
  const { agent_id, userId, outputData, supabaseAdmin } = args

  const { data: tasks } = await supabaseAdmin
    .from('agent_tasks')
    .select('id')
    .eq('agent_id', agent_id)
    .eq('source', 'telegram')
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)

  const task = tasks?.[0] as { id: string } | undefined
  if (!task) return

  await supabaseAdmin
    .from('agent_tasks')
    .update({
      status: 'completed',
      result: outputData,
      completed_at: new Date().toISOString(),
    })
    .eq('id', task.id)

  const summary = formatOutputSummary(outputData)
  const message = summary
    ? `✅ Agent completed task\n\n${summary}`
    : '✅ Agent completed task'

  await sendTelegramToUser(userId, message)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { key, agent_id, label, data, tokens_used = 0, model } = body

    const auth: any = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin, agentId: jwtAgentId } = auth as any
    const { getUserUsage } = await import('@/lib/usage')
    const usage = await getUserUsage(userId)

    if (usage.monthlyTokens >= usage.tokensLimit) {
      return NextResponse.json({ 
        error: 'quota_exceeded', 
        message: `Monthly token limit reached for ${usage.plan} plan (${usage.tokensLimit.toLocaleString()}). Upgrade for more capacity.`,
        upgrade_url: '/dashboard/settings'
      }, { status: 402 })
    }

    // Verify agent belongs to user (skip DB hit if valid JWT connects them)
    if (!jwtAgentId || jwtAgentId !== agent_id) {
      const { data: agent } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single()

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
      }
    }

    // Store output log
    await supabaseAdmin!
      .from('agent_logs')
      .insert({
        agent_id,
        type: 'output',
        level: 'success',
        message: label ? `Output: ${label}` : 'Task output generated',
        data: data || {},
        tokens_used,
        model: model || null
      })

    // ✅ Track cost in INR
    if (tokens_used > 0) {
      const cost_usd     = tokens_used * getCostPerToken(model)
      const cost_inr     = cost_usd * USD_TO_INR  // ✅ convert to ₹

      await supabaseAdmin!
        .from('credit_usage')
        .insert({
          user_id: userId,
          agent_id,
          tokens_used,
          model,
          cost_usd,
          cost_inr
        })
    }

    // Dispatch task completion → update task + Telegram (only for active telegram-sourced tasks)
    const outputData = (data as Record<string, unknown>) || {}
    setImmediate(() => {
      completeDispatchTask({
        agent_id,
        userId,
        outputData,
        supabaseAdmin: supabaseAdmin!,
      }).catch((err) => console.error('Dispatch completion error:', err))
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Output error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
