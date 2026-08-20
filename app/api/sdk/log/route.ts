import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import type { SupabaseClient } from '@supabase/supabase-js'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { logSchema } from '@/lib/schemas/sdk-schemas'
import { getCostPerToken } from '@/lib/pricing'
import { sendTelegramToUser } from '@/lib/telegram'
import { getUpstashConfig, upstashRest, acquireLock } from '@/lib/redis'
import crypto from 'crypto'

const MESSAGE_MAX_LENGTH = 1000
const DATA_MAX_BYTES = 200_000
const EVENT_DEDUPE_TTL_SECONDS = 60 * 60 * 24 // 24h

async function isDuplicateEvent(args: {
  userId: string
  agentId: string
  eventId: string
}): Promise<boolean> {
  const cfg = getUpstashConfig()
  if (!cfg) return false // fail-open

  const { userId, agentId, eventId } = args
  if (!userId || !agentId || !eventId) return false

  const dedupeKey = `agenthelm:log:dedupe:${userId}:${agentId}:${eventId}`
  const setRes = await upstashRest(
    `set/${encodeURIComponent(dedupeKey)}/1/NX/EX/${EVENT_DEDUPE_TTL_SECONDS}`
  )

  const result = setRes?.result
  return result !== 'OK'
}

const progressThrottle = new Map<string, { lastSentAt: number; lastStep?: number; lastPercent?: number }>()
const THROTTLE_MS = 10_000

async function sendProgressToTelegram(args: {
  agent_id: string
  userId: string
  agentName: string
  message: string
  step?: number
  total_steps?: number
  percent?: number
  supabaseAdmin: SupabaseClient
}) {
  const { agent_id, userId, agentName, message, step, total_steps, percent, supabaseAdmin } = args

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

  const now = Date.now()
  const entry = progressThrottle.get(task.id)
  const stepChanged = step !== undefined && step !== entry?.lastStep
  const percentChanged = step === undefined && percent !== undefined && percent !== entry?.lastPercent
  const timeExpired = !entry || (now - entry.lastSentAt) > THROTTLE_MS
  const shouldSend = stepChanged || percentChanged || timeExpired
  if (!shouldSend) return

  let prefix = ''
  if (step !== undefined && total_steps !== undefined && total_steps > 0) {
    prefix = `Step ${step}/${total_steps} `
  } else if (percent !== undefined) {
    prefix = `${percent}% `
  }
  const formatted = `🔄 ${agentName}: ${prefix}${message}`

  await sendTelegramToUser(userId, formatted)
  progressThrottle.set(task.id, { lastSentAt: now, lastStep: step, lastPercent: percent })
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
    .select('id, outcome_fee_usd')
    .eq('agent_id', agent_id)
    .eq('source', 'telegram')
    .in('status', ['pending', 'running'])
    .order('created_at', { ascending: false })
    .limit(1)

  const task = tasks?.[0] as { id: string, outcome_fee_usd?: number } | undefined
  if (!task) return

  const locked = await acquireLock(`agenthelm:billing:dedupe:${task.id}`, 86400, false)
  if (!locked) {
    console.warn(`[Billing Idempotency] Skipping duplicate completeDispatchTask for task ${task.id}`)
    return
  }

  await supabaseAdmin
    .from('agent_tasks')
    .update({
      status: 'completed',
      result: outputData,
      completed_at: new Date().toISOString(),
    })
    .eq('id', task.id)

  if (task.outcome_fee_usd && task.outcome_fee_usd > 0) {
    const feeCredits = Math.ceil(task.outcome_fee_usd * 100)
    const idempotencyKey = `outcome:${task.id}`

    // Atomic credit deduction via RPC
    const { data: deducted } = await supabaseAdmin.rpc('deduct_credit', {
      p_user_id: userId,
      p_amount: feeCredits,
      p_reason: `Outcome fee for task ${task.id}`,
      p_idempotency_key: idempotencyKey,
      p_agent_id: agent_id
    })

    if (!deducted) {
      console.warn(`[Billing] Insufficient balance for outcome fee on task ${task.id}`)
    }

    await supabaseAdmin
      .from('credit_usage')
      .insert({
        user_id: userId,
        agent_id,
        tokens_used: 0,
        model: 'Outcome Fee',
        cost_usd: task.outcome_fee_usd
      })
  }

  const summary = formatOutputSummary(outputData)
  const message = summary
    ? `✅ Agent completed task\n\n${summary}`
    : '✅ Agent completed task'

  await sendTelegramToUser(userId, message)
}

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: logSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body, agent } = ctx
    const {
      type = 'log',
      level = 'info',
      message = '',
      data,
      tokens_used = 0,
      model,
      event_id,
    } = body

    // Normalize message
    let safeMessage = typeof message === 'string' ? message : String(message ?? '')
    if (safeMessage.length > MESSAGE_MAX_LENGTH) {
      safeMessage = safeMessage.slice(0, MESSAGE_MAX_LENGTH - 1) + '…'
    }

    // Validate data size
    const safeData: unknown = data === undefined ? null : data
    if (safeData !== null) {
      try {
        const json = JSON.stringify(safeData)
        const bytes = new TextEncoder().encode(json).length
        if (bytes > DATA_MAX_BYTES) {
          return NextResponse.json(
            { error: 'data_too_large', max_bytes: DATA_MAX_BYTES },
            { status: 413 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'data_not_serializable' },
          { status: 400 }
        )
      }
    }

    // Deduplication
    if (event_id !== undefined && event_id !== null) {
      const eventIdStr = String(event_id).trim()
      if (eventIdStr) {
        const duplicate = await isDuplicateEvent({
          userId,
          agentId: agentId!,
          eventId: eventIdStr,
        })
        if (duplicate) {
          return NextResponse.json({ success: true, duplicate: true })
        }
      }
    }

    // Insert log
    await supabase
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        type,
        level,
        message: safeMessage,
        data: safeData,
        tokens_used,
        model: model || null
      })

    // Token tracking & atomic deduction
    if (type === 'tokens' && tokens_used > 0) {
      const cost_usd = (body.cost_usd && body.cost_usd > 0)
        ? body.cost_usd
        : tokens_used * getCostPerToken(model ?? null)

      const creditAmount = Math.max(1, Math.ceil(cost_usd * 100))
      const logHash = crypto.createHash('sha256')
        .update(`${agentId}:${tokens_used}:${Date.now()}:${safeMessage}`)
        .digest('hex')
      const idempotencyKey = `log_tokens:${logHash}`

      // Single atomic RPC call
      await supabase.rpc('deduct_credit', {
        p_user_id: userId,
        p_amount: creditAmount,
        p_reason: `Token consumption (${tokens_used} tokens, ${model || 'default'})`,
        p_idempotency_key: idempotencyKey,
        p_agent_id: agentId
      })

      await supabase
        .from('credit_usage')
        .insert({
          user_id: userId,
          agent_id: agentId,
          tokens_used,
          model,
          cost_usd
        })
    }

    // Handle error cascades
    if (level === 'error') {
      await supabase
        .from('agents')
        .update({ status: 'error', error_message: safeMessage })
        .eq('id', agentId)
    }

    // Handle incoming chat replies
    if (type === 'chat_reply') {
      await supabase
        .from('agent_chats')
        .insert({
          agent_id: agentId,
          user_id: userId,
          role: 'agent',
          content: safeMessage,
          source: 'dashboard'
        })
    }

    const agentName = agent?.id ? "Agent" : "Unknown Agent"

    // Background notifications
    if (type === 'progress') {
      const progressData =
        (safeData as { step?: number; total_steps?: number; percent?: number }) || {}
      setImmediate(() => {
        sendProgressToTelegram({
          agent_id: agentId!,
          userId,
          agentName,
          message: safeMessage,
          step: progressData.step,
          total_steps: progressData.total_steps,
          percent: progressData.percent,
          supabaseAdmin: supabase,
        }).catch((err) => console.error('Progress Telegram error:', err))
      })
    }

    if (type === 'output') {
      const outputData = (safeData as Record<string, unknown> | null) || {}
      setImmediate(() => {
        completeDispatchTask({
          agent_id: agentId!,
          userId,
          outputData,
          supabaseAdmin: supabase,
        }).catch((err) => console.error('Dispatch completion error:', err))
      })
    }

    return NextResponse.json({ success: true })
  }
)
