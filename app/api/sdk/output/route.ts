import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import type { SupabaseClient } from '@supabase/supabase-js'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { getCostPerToken } from '@/lib/pricing'
import { sendTelegramToUser } from '@/lib/telegram'
import { z } from 'zod'

const USD_TO_INR = 84.5

const outputRouteSchema = z.object({
  agent_id: z.string().uuid(),
  label: z.string().optional(),
  data: z.any().optional(),
  output: z.any().optional(),
  tokens_used: z.number().int().min(0).default(0),
  model: z.string().optional(),
})

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

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: outputRouteSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const { label, tokens_used = 0, model } = body
    const outputContent = body.data || body.output || {}

    // Store output log
    await supabase
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        type: 'output',
        level: 'success',
        message: label ? `Output: ${label}` : 'Task output generated',
        data: outputContent,
        tokens_used,
        model: model || null
      })

    // Track cost in INR/USD
    if (tokens_used > 0) {
      const cost_usd = tokens_used * getCostPerToken(model ?? null)
      const cost_inr = cost_usd * USD_TO_INR

      await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          agent_id: agentId,
          tokens_used,
          model,
          cost_usd,
          cost_inr
        })
    }

    const outputData = (typeof outputContent === 'object' && outputContent !== null)
      ? outputContent as Record<string, unknown>
      : { value: outputContent }

    setImmediate(() => {
      completeDispatchTask({
        agent_id: agentId!,
        userId,
        outputData,
        supabaseAdmin: supabase,
      }).catch((err) => console.error('Dispatch completion error:', err))
    })

    return NextResponse.json({ success: true })
  }
)
