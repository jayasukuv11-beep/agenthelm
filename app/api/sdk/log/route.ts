import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import type { SupabaseClient } from '@supabase/supabase-js'
import { validateConnectKey } from '@/lib/sdk-auth'
import { sendTelegramToUser } from '@/lib/telegram'

// ─── Request Hardening ───────────────────────────────────────────────────────

const MESSAGE_MAX_LENGTH = 1000
const DATA_MAX_BYTES = 200_000

// Rate limit: 1000 requests/hour per SDK `key`
const RATE_LIMIT_REQUESTS_PER_HOUR = 1000
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60

// Dedupe: suppress duplicates for a while when `event_id` is provided
const EVENT_DEDUPE_TTL_SECONDS = 60 * 60 * 24 // 24h

type UpstashConfig = { url: string; token: string }

function getUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url: url.replace(/\/+$/, ''), token }
}

async function upstashRest(cmdPath: string): Promise<any | null> {
  const cfg = getUpstashConfig()
  if (!cfg) return null

  try {
    const res = await fetch(`${cfg.url}/${cmdPath}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${cfg.token}` },
    })
    if (!res.ok) return null
    return await res.json().catch(() => null)
  } catch {
    return null
  }
}

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
    .map(([k, v]) => {
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

    // Validate + normalize message
    let safeMessage = typeof message === 'string' ? message : String(message ?? '')
    if (safeMessage.length > MESSAGE_MAX_LENGTH) {
      // Truncate rather than rejecting to avoid breaking existing SDK clients.
      safeMessage = safeMessage.slice(0, MESSAGE_MAX_LENGTH - 1) + '…'
    }

    // Validate + normalize data size
    let safeData: unknown = data === undefined ? null : data
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

    const auth = await validateConnectKey(key)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { userId, supabaseAdmin } = auth

    // Verify agent belongs to user
    const { data: agent } = await supabaseAdmin!
      .from('agents')
      .select('id, user_id, name')
      .eq('id', agent_id)
      .eq('user_id', userId)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
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
      let cost_usd = 0;
      if (model?.includes('gemini-flash')) cost_usd = tokens_used * 0.0000001;
      else if (model?.includes('gpt-4')) cost_usd = tokens_used * 0.00003;
      else if (model?.includes('sonnet')) cost_usd = tokens_used * 0.000015;

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
      const agentUserId = (agent as { user_id: string }).user_id
      await supabaseAdmin!
        .from('agent_chats')
        .insert({
          agent_id,
          user_id: agentUserId || userId,
          role: 'agent',
          content: message,
          source: 'dashboard'
        })
    }

    // Run anomaly check in background — do NOT await (never slow down SDK)
    const agentName = (agent as { name: string }).name
    setImmediate(async () => {
      const { checkAnomalies } = await import('@/lib/anomaly')
      await checkAnomalies(agent_id, userId!, agentName)
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

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    console.error('Log error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
