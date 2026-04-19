import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import type { SupabaseClient } from '@supabase/supabase-js'
import { validateConnectKey } from '@/lib/sdk-auth'
import { getCostPerToken } from '@/lib/pricing'
import { sendTelegramToUser } from '@/lib/telegram'

// ─── Request Hardening ───────────────────────────────────────────────────────

const MESSAGE_MAX_LENGTH = 1000
const DATA_MAX_BYTES = 200_000

// Rate limit: 1000 requests/hour per SDK `key`
const RATE_LIMIT_REQUESTS_PER_HOUR = 1000
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60

// Dedupe: suppress duplicates for a while when `event_id` is provided
const EVENT_DEDUPE_TTL_SECONDS = 60 * 60 * 24 // 24h

import { getUpstashConfig, upstashRest, acquireLock } from '@/lib/redis'


async function isRateLimited(connectKey: string): Promise<boolean> {
  const cfg = getUpstashConfig()
  if (!cfg) return false // fail-open so existing functionality doesn't break
  if (!connectKey) return false

  const rlKey = `agenthelm:log:rl:${connectKey}`
  const incr = await upstashRest(
    `incr/${encodeURIComponent(rlKey)}`
  )
  const count = Number(incr?.result ?? incr)
  if (!Number.isFinite(count)) return false

  if (count === 1) {
    // Ensure the counter expires; if this fails we still "fail-open" (don't block requests).
    await upstashRest(
      `expire/${encodeURIComponent(rlKey)}/${RATE_LIMIT_WINDOW_SECONDS}`
    )
  }

  return count > RATE_LIMIT_REQUESTS_PER_HOUR
}

async function isDuplicateEvent(args: {
  connectKey: string
  agentId: string
  eventId: string
}): Promise<boolean> {
  const cfg = getUpstashConfig()
  if (!cfg) return false // fail-open

  const { connectKey, agentId, eventId } = args
  if (!connectKey || !agentId || !eventId) return false

  // Atomically reserve the event id.
  // SET ... NX EX returns { result: "OK" } if set, otherwise result is null.
  const dedupeKey = `agenthelm:log:dedupe:${connectKey}:${agentId}:${eventId}`
  const setRes = await upstashRest(
    `set/${encodeURIComponent(dedupeKey)}/1/NX/EX/${EVENT_DEDUPE_TTL_SECONDS}`
  )

  const result = setRes?.result
  return result !== 'OK'
}

// Throttle state for progress Telegram messages (task_id -> { lastSentAt, lastStep, lastPercent })
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

  // IDEMPOTENCY LOCK: Prevent double-charges due to network HTTP retries payload duplicate submissions.
  // Fail-closed (false) heavily protects against duplicate billing if Redis goes down, 
  // but if we want to prioritize task completion over perfect billing, we could pass true instead.
  // We use `false` (fail-closed) because billing integrity is critical.
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

  // PHASE 2: Outcome-Based Metering
  if (task.outcome_fee_usd && task.outcome_fee_usd > 0) {
    await supabaseAdmin
      .from('credit_usage')
      .insert({
        user_id: userId,
        agent_id,
        tokens_used: 0,
        model: 'Outcome Fee',
        cost_usd: task.outcome_fee_usd
      })
      
    // Deduct from profile balance
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('outcome_credits_balance')
      .eq('id', userId)
      .single()
      
    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ outcome_credits_balance: Number(profile.outcome_credits_balance) - task.outcome_fee_usd })
        .eq('id', userId)
    }
  }

  const summary = formatOutputSummary(outputData)
  const message = summary
    ? `✅ Agent completed task\n\n${summary}`
    : '✅ Agent completed task'

  await sendTelegramToUser(userId, message)
}

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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      key,
      agent_id,
      type = 'log',
      level = 'info',
      message,
      data,
      tokens_used = 0,
      model,
      event_id,
    } = body

    if (body.tokens_used !== undefined && body.tokens_used <= 0) {
      return NextResponse.json(
        { error: 'tokens_used must be a positive integer' },
        { status: 400 }
      )
    }

    // Validate + normalize message
    let safeMessage = typeof message === 'string' ? message : String(message ?? '')
    if (safeMessage.length > MESSAGE_MAX_LENGTH) {
      // Truncate rather than rejecting to avoid breaking existing SDK clients.
      safeMessage = safeMessage.slice(0, MESSAGE_MAX_LENGTH - 1) + '…'
    }

    // Validate + normalize data size
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

    // Rate limit per connect key (fail-open if Upstash isn't configured)
    if (typeof key === 'string' && key) {
      const limited = await isRateLimited(key)
      if (limited) {
        return NextResponse.json(
          { error: 'rate_limited', limit_per_hour: RATE_LIMIT_REQUESTS_PER_HOUR },
          { status: 429 }
        )
      }
    }

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

    // Phase 2: Budget Cap Enforcement ($10 hard limit)
    const MAX_BUDGET_USD = 10.00;
    if (usage.monthlyCostUsd >= MAX_BUDGET_USD) {
       const { data: currentAgent } = await supabaseAdmin!.from('agents').select('status, name').eq('id', agent_id).single()
       
       // Only send the telegram message once when the agent transitions to error state
       if (currentAgent?.status !== 'error') {
           await supabaseAdmin!.from('agents').update({ status: 'error', error_message: 'Budget Cap Exceeded ($10.00)' }).eq('id', agent_id)
           await sendTelegramToUser(userId, `🛑 *Budget Cap Reached!*\n${currentAgent?.name || 'Agent'} has hit your $${MAX_BUDGET_USD.toFixed(2)} spend limit and has been forcefully stopped to protect your wallet.`)
       }
       
       return NextResponse.json({
         error: 'payment_required',
         message: `Budget cap of $${MAX_BUDGET_USD.toFixed(2)} exceeded. Agent stopped.`
       }, { status: 402 })
    }

    // If no valid JWT connects them, verify ownership via DB
    let agentName = "Unknown Agent"
    if (!jwtAgentId || jwtAgentId !== agent_id) {
      const { data: dbAgent } = await supabaseAdmin!
        .from('agents')
        .select('id, user_id, name')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .single()

      if (!dbAgent) {
        return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
      }
      agentName = dbAgent.name
    }

    // Prevent duplicate logs when `event_id` is provided
    if (typeof event_id === 'string' || typeof event_id === 'number') {
      const eventIdStr = String(event_id).trim()
      if (eventIdStr) {
        const duplicate = await isDuplicateEvent({
          connectKey: key,
          agentId: agent_id,
          eventId: eventIdStr,
        })
        if (duplicate) {
          return NextResponse.json({ success: true, duplicate: true })
        }
      }
    }

    // Insert log
    await supabaseAdmin!
      .from('agent_logs')
      .insert({
        agent_id,
        type,
        level,
        message: safeMessage,
        data: safeData,
        tokens_used,
        model: model || null
      })

    // Handle token tracking 
    if (type === 'tokens' && tokens_used > 0) {
      // Use SDK-provided cost if available, otherwise calculate from unified pricing
      const cost_usd = (body.cost_usd && body.cost_usd > 0)
        ? body.cost_usd
        : tokens_used * getCostPerToken(model);

      await supabaseAdmin!
        .from('credit_usage')
        .insert({
          user_id: userId,
          agent_id,
          tokens_used,
          model,
          cost_usd
        })
    }

    // Handle error cascades
    if (level === 'error') {
      await supabaseAdmin!
        .from('agents')
        .update({ status: 'error', error_message: safeMessage })
        .eq('id', agent_id)
    }

    // Handle incoming chat replies from the SDK
    if (type === 'chat_reply') {
      await supabaseAdmin!
        .from('agent_chats')
        .insert({
          agent_id,
          user_id: userId,
          role: 'agent',
          content: message,
          source: 'dashboard'
        })
    }

    // Run anomaly check in background — do NOT await (never slow down SDK)
    setImmediate(async () => {
      let finalAgentName = agentName
      if (finalAgentName === "Unknown Agent") {
        const { data } = await supabaseAdmin!.from('agents').select('name').eq('id', agent_id).single()
        if (data) finalAgentName = data.name
      }
      const { checkAnomalies } = await import('@/lib/anomaly')
      await checkAnomalies(agent_id, userId!, finalAgentName)
    })

    // Progress → Telegram (throttled, only for active telegram-sourced tasks)
    if (type === 'progress') {
      const progressData =
        (safeData as { step?: number; total_steps?: number; percent?: number }) || {}
      setImmediate(() => {
        sendProgressToTelegram({
          agent_id,
          userId: userId!,
          agentName,
          message: safeMessage,
          step: progressData.step,
          total_steps: progressData.total_steps,
          percent: progressData.percent,
          supabaseAdmin: supabaseAdmin!,
        }).catch((err) => console.error('Progress Telegram error:', err))
      })
    }

    // Output → complete dispatch task + Telegram (only for active telegram-sourced tasks)
    if (type === 'output') {
      const outputData =
        (safeData as Record<string, unknown> | null) || {}
      setImmediate(() => {
        completeDispatchTask({
          agent_id,
          userId: userId!,
          outputData,
          supabaseAdmin: supabaseAdmin!,
        }).catch((err) => console.error('Dispatch completion error:', err))
      })
    }

    // Burn-rate → Telegram alert
    if (type === 'burn_rate') {
      setImmediate(async () => {
        const burnData = (safeData as any) || {}
        const alertMsg = `🔥 *Burn-rate Alert: ${agentName}*\n` +
          `Token consumption is too high: ${Number(burnData.tokens_per_minute).toLocaleString()}/min\n` +
          `Threshold: ${Number(burnData.threshold).toLocaleString()}/min`
        
        await sendTelegramToUser(userId!, alertMsg)
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('Log error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
