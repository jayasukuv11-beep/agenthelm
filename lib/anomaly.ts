import { createClient } from '@supabase/supabase-js'

// ─── Admin client (server-only) ───────────────────────────────────────────────

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileRow = {
  telegram_chat_id: string | null
  plan: string | null
}

type AgentRow = {
  status: string
  last_ping: string | null
  name: string
}

type LogRow = {
  level: string
}

type UsageRow = {
  tokens_used: number
}

// ─── Main anomaly checker ─────────────────────────────────────────────────────

export async function checkAnomalies(
  agentId: string,
  userId: string,
  agentName: string
): Promise<void> {
  try {
    const supabaseAdmin = getAdmin()

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('telegram_chat_id, plan')
      .eq('id', userId)
      .single<ProfileRow>()

    const telegramChatId = profile?.telegram_chat_id
    const plan = profile?.plan ?? 'free'

    // ── RULE 1 (ALL PLANS): Agent went silent ────────────────────────────────
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('status, last_ping, name')
      .eq('id', agentId)
      .single<AgentRow>()

    if (agent?.last_ping) {
      const silentMs = Date.now() - new Date(agent.last_ping).getTime()
      const tenMinutes = 10 * 60 * 1000

      if (agent.status === 'running' && silentMs > tenMinutes) {
        await supabaseAdmin
          .from('agents')
          .update({ status: 'stopped' })
          .eq('id', agentId)

        if (telegramChatId) {
          await sendTelegramAlert(
            parseInt(telegramChatId),
            `🔴 <b>${agentName} has gone silent</b>\n\n` +
              `No ping received in ${Math.round(silentMs / 60000)} minutes.\n` +
              `Status updated to: stopped\n\n` +
              `Use /run ${agentName} to restart.`,
            'HTML'
          )
        }
      }
    }

    // Indie/Studio-only rules
    if (plan === 'free') return

    // ── RULE 2 (INDIE+): High error rate ─────────────────────────────────────
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const { data: recentLogs } = await supabaseAdmin
      .from('agent_logs')
      .select('level')
      .eq('agent_id', agentId)
      .gte('created_at', fiveMinutesAgo.toISOString())

    if (recentLogs && (recentLogs as LogRow[]).length >= 5) {
      const errorCount = (recentLogs as LogRow[]).filter(
        (l) => l.level === 'error'
      ).length
      const errorRate = errorCount / (recentLogs as LogRow[]).length

      if (errorRate > 0.2 && telegramChatId) {
        await sendTelegramAlert(
          parseInt(telegramChatId),
          `⚠️ <b>High error rate — ${agentName}</b>\n\n` +
            `${Math.round(errorRate * 100)}% of recent logs are errors.\n` +
            `${errorCount} errors in last 5 minutes.\n\n` +
            `Use /logs ${agentName} to see recent logs.`,
          'HTML'
        )
      }
    }

    // ── RULE 3 (INDIE+): Token spike ─────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data: hourlyUsage } = await supabaseAdmin
      .from('credit_usage')
      .select('tokens_used')
      .eq('agent_id', agentId)
      .gte('created_at', oneHourAgo.toISOString())

    const { data: dailyUsage } = await supabaseAdmin
      .from('credit_usage')
      .select('tokens_used')
      .eq('agent_id', agentId)
      .gte('created_at', oneDayAgo.toISOString())

    const hourlyTokens =
      (hourlyUsage as UsageRow[] | null)?.reduce(
        (sum, r) => sum + (r.tokens_used ?? 0),
        0
      ) ?? 0

    const dailyTokens =
      (dailyUsage as UsageRow[] | null)?.reduce(
        (sum, r) => sum + (r.tokens_used ?? 0),
        0
      ) ?? 0

    const dailyAvgPerHour = dailyTokens / 24

    if (
      hourlyTokens > dailyAvgPerHour * 3 &&
      dailyAvgPerHour > 100 &&
      telegramChatId
    ) {
      await sendTelegramAlert(
        parseInt(telegramChatId),
        `💰 <b>Token spike — ${agentName}</b>\n\n` +
          `Used ${hourlyTokens.toLocaleString()} tokens this hour.\n` +
          `That's ${Math.round(hourlyTokens / dailyAvgPerHour)}x your normal rate.\n\n` +
          `Check /credits for full usage.`,
        'HTML'
      )
    }
  } catch (error) {
    // Silently fail — never break the main log flow
    console.error('Anomaly check error:', error)
  }
}

// ─── Shared Telegram alert sender ────────────────────────────────────────────

export async function sendTelegramAlert(
  chatId: number,
  text: string,
  parseMode?: 'HTML' | 'Markdown'
): Promise<void> {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          ...(parseMode ? { parse_mode: parseMode } : {}),
        }),
      }
    )
  } catch (error) {
    console.error('Telegram alert failed:', error)
  }
}
