import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function callNvidia(prompt: string, fast = false): Promise<{ text: string; tokens: number }> {
  const model = fast
    ? 'meta/llama-3.1-8b-instruct'
    : 'meta/llama-3.3-70b-instruct'

  const res = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI agent analyst. Be concise and helpful.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false,
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.detail || data.message || 'NVIDIA API error')
  }

  const text = data.choices?.[0]?.message?.content || ''
  const tokens = data.usage?.total_tokens || 0
  return { text, tokens }
}export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type TelegramMessage = {
  chat: { id: number }
  from: { id: number }
  text?: string
  message_id: number
}

type TelegramUpdate = {
  message?: TelegramMessage
  edited_message?: TelegramMessage
  callback_query?: {
    id: string
    from: { id: number }
    data: string
    message: TelegramMessage
  }
}

type Profile = {
  id: string
  full_name: string | null
  plan: string
  tokens_limit_monthly: number | null
}

type AgentRow = {
  id: string
  name: string
  status: string
  last_ping: string | null
  agent_type: string | null
}

// ─── Admin client (server-only) ───────────────────────────────────────────────

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as TelegramUpdate

    const message = body.message ?? body.edited_message
    const callbackQuery = body.callback_query

    if (callbackQuery) {
      const chatId = callbackQuery.message.chat.id
      const telegramUserId = callbackQuery.from.id
      const data = callbackQuery.data
      await handleCallbackQuery(chatId, telegramUserId, data, callbackQuery.id, callbackQuery.message.message_id)
      return NextResponse.json({ ok: true })
    }

    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text ?? ''
    const telegramUserId = message.from.id

    // /start is the only command that works before connection
    if (text.startsWith('/start')) {
      await handleStart(chatId, text, telegramUserId)
      return NextResponse.json({ ok: true })
    }

    const user = await getUserByTelegramId(chatId)

    if (!user) {
      await sendMessage(
        chatId,
        '❌ Account not connected.\n\n' +
          'Go to your AgentHelm settings to connect Telegram:\n' +
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
      )
      return NextResponse.json({ ok: true })
    }

    const plan = user.plan || 'free'
    const words = text.split(/\s+/)
    const cmd = words[0].toLowerCase()

    if (cmd === '/start') {
      await handleStart(chatId, text, telegramUserId)
    } else if (cmd === '/agents' || cmd === '/agent') {
      await handleAgents(chatId, user.id)
    } else if (cmd === '/status') {
      await handleStatus(chatId, user.id, text)
    } else if (cmd === '/logs') {
      await handleLogs(chatId, user.id, text)
    } else if (cmd === '/run') {
      await handleRun(chatId, user.id, text)
    } else if (cmd === '/stop') {
      await handleStop(chatId, user.id, text)
    } else if (cmd === '/dispatch') {
      await handleDispatch(chatId, user.id, text, plan)
    } else if (cmd === '/summary') {
      await handleSummary(chatId, user.id, plan)
    } else if (cmd === '/credits') {
      await handleCredits(chatId, user.id)
    } else if (cmd === '/help') {
      await handleHelp(chatId)
    } else if (cmd === '/disconnect') {
      await handleDisconnect(chatId, user.id)
    } else {
      // Natural Language Processing
      await handleFreeText(chatId, user.id, text, plan)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always 200 to Telegram
  }
}

async function handleCallbackQuery(
  chatId: number,
  telegramUserId: number,
  data: string,
  callbackQueryId: string,
  messageId: number
): Promise<void> {
  const [action, id] = data.split(':')

  if (action === 'cancel') {
    await deleteMessage(chatId, messageId)
    await answerCallbackQuery(callbackQueryId, 'Command cancelled.')
    return
  }

  // Resolve user by telegramId
  const user = await getUserByTelegramId(chatId)
  if (!user) {
    await answerCallbackQuery(callbackQueryId, '❌ Account not connected.')
    return
  }

  if (action === 'confirm_stop') {
    const { error } = await supabaseAdmin
      .from('agent_commands')
      .update({ status: 'pending' })
      .eq('id', id)
      .eq('status', 'draft')

    if (error) {
      await answerCallbackQuery(callbackQueryId, '❌ Failed to confirm.')
    } else {
      await deleteMessage(chatId, messageId)
      await sendMessage(chatId, '✅ Stop command activated.')
      await answerCallbackQuery(callbackQueryId, 'Stop confirmed.')
    }
  }

  if (action === 'confirm_dispatch') {
    // Confirm both the task and the command
    const { data: command } = await supabaseAdmin
      .from('agent_commands')
      .select('agent_id, payload')
      .eq('id', id)
      .single()

    if (command) {
      await supabaseAdmin
        .from('agent_commands')
        .update({ status: 'pending' })
        .eq('id', id)

      // Also update any matching task in agent_tasks
      const payload = command.payload as { task?: string }
      if (payload?.task) {
        await supabaseAdmin
          .from('agent_tasks')
          .update({ status: 'pending' })
          .eq('agent_id', command.agent_id)
          .eq('task_description', payload.task)
          .eq('status', 'draft')
      }
    }

    await deleteMessage(chatId, messageId)
    await sendMessage(chatId, '✅ Task dispatch confirmed.')
    await answerCallbackQuery(callbackQueryId, 'Dispatch confirmed.')
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'AgentHelm Telegram Bot Active' })
}

// ─── Command: /start ──────────────────────────────────────────────────────────

async function handleStart(
  chatId: number,
  text: string,
  _telegramUserId: number
): Promise<void> {
  const parts = text.split(' ')
  const connectKey = parts[1]

  if (!connectKey || !connectKey.startsWith('ahe_live_')) {
    await sendMessage(
      chatId,
      '👋 Welcome to AgentHelm Bot!\n\n' +
        'To connect your account:\n' +
        '1. Go to agenthelm.dev/dashboard/settings\n' +
        '2. Click "Connect Telegram"\n' +
        '3. The link will connect automatically\n\n' +
        'Type /help to see all commands.'
    )
    return
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, plan')
    .eq('connect_key', connectKey)
    .single<Pick<Profile, 'id' | 'full_name' | 'plan'>>()

  if (!profile) {
    await sendMessage(
      chatId,
      '❌ Invalid connect key.\n\n' +
        'Get your key from:\n' +
        'agenthelm.dev/dashboard/settings'
    )
    return
  }

  await supabaseAdmin
    .from('profiles')
    .update({ telegram_chat_id: chatId.toString() })
    .eq('id', profile.id)

  const name = profile.full_name ?? 'Developer'

  await sendMessage(
    chatId,
    `✅ <b>Connected to AgentHelm!</b>\n\n` +
      `Welcome, ${name}!\n\n` +
      `Your agents will now send alerts here.\n\n` +
      `<b>Available commands:</b>\n` +
      `/agents — list all your agents\n` +
      `/status — check agent status\n` +
      `/logs — see recent logs\n` +
      `/run — start an agent\n` +
      `/stop — stop an agent\n` +
      `/dispatch — send a task to an agent\n` +
      `/credits — check token usage\n` +
      `/help — show all commands\n` +
      `/disconnect — unlink Telegram`,
    'HTML'
  )
}

// ─── Command: /help ───────────────────────────────────────────────────────────

async function handleHelp(chatId: number): Promise<void> {
  await sendMessage(
    chatId,
    `⚡ <b>AgentHelm Bot Commands</b>\n\n` +
      `<b>Monitoring:</b>\n` +
      `/agents — list all agents + status\n` +
      `/status [name] — detailed agent status\n` +
      `/logs [name] — last 5 log entries\n` +
      `/summary — 24h activity summary\n` +
      `/credits — token usage this month\n\n` +
      `<b>Control:</b>\n` +
      `/run [name] — start an agent\n` +
      `/stop [name] — stop an agent\n` +
      `/dispatch [name] [task] — send task to agent\n\n` +
      `<b>Account:</b>\n` +
      `/disconnect — unlink this Telegram\n` +
      `/help — show this message\n\n` +
      `💡 You can also type naturally:\n` +
      `"is my lead agent running?"\n` +
      `"stop the email bot"`,
    'HTML'
  )
}

// ─── Command: /agents ─────────────────────────────────────────────────────────

async function handleAgents(chatId: number, userId: string): Promise<void> {
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('id, name, status, last_ping, agent_type')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .returns<AgentRow[]>()

  if (!agents || agents.length === 0) {
    await sendMessage(
      chatId,
      '🤖 No agents connected yet.\n\n' +
        'Connect your first agent:\n' +
        'pip install agenthelm-sdk\n\n' +
        'import agenthelm\n' +
        'dock = agenthelm.connect("your-key")'
    )
    return
  }

  const agentList = agents
    .map((agent) => {
      const statusEmoji =
        agent.status === 'running'
          ? '🟢'
          : agent.status === 'idle'
            ? '🟡'
            : agent.status === 'error'
              ? '⚠️'
              : '🔴'

      const lastPing = agent.last_ping
        ? getTimeAgo(new Date(agent.last_ping))
        : 'Never'

      return (
        `${statusEmoji} <b>${agent.name}</b>\n` +
        `   Status: ${agent.status}\n` +
        `   Last ping: ${lastPing}`
      )
    })
    .join('\n\n')

  await sendMessage(
    chatId,
    `🤖 <b>Your Agents (${agents.length})</b>\n\n${agentList}\n\n` +
      `Use /status [name] for details`,
    'HTML'
  )
}

// ─── Command: /status ─────────────────────────────────────────────────────────

async function handleStatus(
  chatId: number,
  userId: string,
  text: string
): Promise<void> {
  const agentName = text.replace('/status', '').trim()

  let query = supabaseAdmin
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (agentName) {
    query = query.ilike('name', `%${agentName}%`)
  }

  const { data: agents } = await query
    .order('last_ping', { ascending: false })
    .limit(1)

  const agent = agents?.[0] as
    | (AgentRow & { error_message?: string })
    | undefined

  if (!agent) {
    await sendMessage(
      chatId,
      agentName
        ? `❌ Agent "${agentName}" not found.\n\nUse /agents to see all agents.`
        : '❌ No agents found. Use /agents to see your agents.'
    )
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: usage } = await supabaseAdmin
    .from('credit_usage')
    .select('tokens_used')
    .eq('agent_id', agent.id)
    .gte('created_at', today.toISOString())

  const tokensToday =
    (usage as Array<{ tokens_used: number }> | null)?.reduce(
      (sum, row) => sum + (row.tokens_used ?? 0),
      0
    ) ?? 0

  const statusEmoji =
    agent.status === 'running'
      ? '🟢'
      : agent.status === 'idle'
        ? '🟡'
        : agent.status === 'error'
          ? '⚠️'
          : '🔴'

  const lastPing = agent.last_ping
    ? getTimeAgo(new Date(agent.last_ping))
    : 'Never'

  let statusText =
    `${statusEmoji} <b>${agent.name}</b>\n\n` +
    `Status: <b>${agent.status}</b>\n` +
    `Type: ${agent.agent_type ?? 'unknown'}\n` +
    `Last ping: ${lastPing}\n` +
    `Tokens today: ${tokensToday.toLocaleString()}\n`

  if (agent.error_message) {
    statusText += `\n⚠️ Last error:\n${agent.error_message}`
  }

  statusText += `\n\nUse /run ${agent.name} or /stop ${agent.name}`

  await sendMessage(chatId, statusText, 'HTML')
}

// ─── Command: /logs ───────────────────────────────────────────────────────────

async function handleLogs(
  chatId: number,
  userId: string,
  text: string
): Promise<void> {
  const agentName = text.replace('/logs', '').trim()

  let agentQuery = supabaseAdmin
    .from('agents')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (agentName) {
    agentQuery = agentQuery.ilike('name', `%${agentName}%`)
  }

  const { data: agents } = await agentQuery.limit(1)
  const agent = agents?.[0] as { id: string; name: string } | undefined

  if (!agent) {
    await sendMessage(
      chatId,
      '❌ Agent not found. Use /agents to see your agents.'
    )
    return
  }

  const { data: logs } = await supabaseAdmin
    .from('agent_logs')
    .select('level, message, created_at, type')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!logs || logs.length === 0) {
    await sendMessage(
      chatId,
      `📋 No logs yet for <b>${agent.name}</b>`,
      'HTML'
    )
    return
  }

  type LogRow = {
    level: string
    message: string
    created_at: string
    type: string
  }

  const logLines = (logs as LogRow[])
    .reverse()
    .map((log) => {
      const emoji =
        log.level === 'error'
          ? '🔴'
          : log.level === 'warning'
            ? '🟡'
            : log.level === 'success'
              ? '🟢'
              : '⚪'
      const time = new Date(log.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `${emoji} [${time}] ${log.message}`
    })
    .join('\n')

  await sendMessage(
    chatId,
    `📋 <b>Recent logs — ${agent.name}</b>\n\n` +
      `<code>${logLines}</code>`,
    'HTML'
  )
}

// ─── Command: /run ────────────────────────────────────────────────────────────

async function handleRun(
  chatId: number,
  userId: string,
  text: string
): Promise<void> {
  const agentName = text.replace('/run', '').trim()
  const agent = await findAgent(userId, agentName)

  if (!agent) {
    await sendMessage(
      chatId,
      '❌ Agent not found.\n\nUsage: /run [agent name]\nExample: /run Lead Agent'
    )
    return
  }

  await supabaseAdmin.from('agent_commands').insert({
    agent_id: agent.id,
    command_type: 'start',
    payload: { source: 'telegram' },
    status: 'pending',
  })

  await sendMessage(
    chatId,
    `▶️ Run command sent to <b>${agent.name}</b>\n\n` +
      `The agent will start on its next poll cycle.\n` +
      `Use /status ${agent.name} to check.`,
    'HTML'
  )
}

// ─── Command: /stop ───────────────────────────────────────────────────────────

async function handleStop(
  chatId: number,
  userId: string,
  text: string
): Promise<void> {
  const agentName = text.replace('/stop', '').trim()
  const agent = await findAgent(userId, agentName)

  if (!agent) {
    await sendMessage(
      chatId,
      '❌ Agent not found.\n\nUsage: /stop [agent name]\nExample: /stop Lead Agent'
    )
    return
  }

  const { data: command, error: cmdError } = await supabaseAdmin
    .from('agent_commands')
    .insert({
      agent_id: agent.id,
      command_type: 'stop',
      payload: { source: 'telegram' },
      status: 'draft',
    })
    .select()
    .single()

  if (cmdError) {
    await sendMessage(chatId, '❌ Failed to stage stop command.')
    return
  }

  await sendMessage(
    chatId,
    `⚠️ <b>Confirm Stop</b>\n\nAre you sure you want to stop <b>${agent.name}</b>?`,
    'HTML',
    {
      inline_keyboard: [
        [
          { text: '✅ Confirm Stop', callback_data: `confirm_stop:${command.id}` },
          { text: '❌ Cancel', callback_data: 'cancel:0' },
        ],
      ],
    }
  )
}

// ─── Command: /dispatch ───────────────────────────────────────────────────────

async function handleDispatch(
  chatId: number,
  userId: string,
  text: string,
  plan?: string
): Promise<void> {
  if (plan === 'free') {
    await sendMessage(
      chatId,
      '🔐 <b>Indie Feature</b>\n\n' +
        'Remote task dispatch is only available on the <b>Indie</b> plan.\n\n' +
        'Upgrade at: agenthelm.online/dashboard/settings',
      'HTML'
    )
    return
  }
  const rest = text.replace(/^\/dispatch\s+/i, '').trim()
  if (!rest) {
    await sendMessage(
      chatId,
      '❌ Usage: /dispatch [agent name] [task]\n\n' +
        'Example: /dispatch Lead Agent summarize today\'s emails'
    )
    return
  }

  const words = rest.split(/\s+/)
  let agent: { id: string; name: string } | null = null
  let task = ''

  for (let i = words.length; i >= 1; i--) {
    const agentPart = words.slice(0, i).join(' ')
    const taskPart = words.slice(i).join(' ').trim()
    if (!taskPart) continue

    const found = await findAgent(userId, agentPart)
    if (found) {
      agent = found
      task = taskPart
      break
    }
  }

  if (!agent || !task) {
    await sendMessage(
      chatId,
      '❌ Agent not found or task is empty.\n\n' +
        'Usage: /dispatch [agent name] [task]\n' +
        'Example: /dispatch Lead Agent summarize today\'s emails'
    )
    return
  }

  const { error: taskError } = await supabaseAdmin
    .from('agent_tasks')
    .insert({
      agent_id: agent.id,
      user_id: userId,
      task_description: task,
      status: 'draft',
      source: 'telegram',
    })

  if (taskError) {
    console.error('agent_tasks insert error:', taskError)
    await sendMessage(chatId, '❌ Failed to create task draft.')
    return
  }

  const { data: command, error: cmdError } = await supabaseAdmin
    .from('agent_commands')
    .insert({
      agent_id: agent.id,
      command_type: 'dispatch',
      payload: { task },
      status: 'draft',
    })
    .select()
    .single()

  if (cmdError) {
    await sendMessage(chatId, '❌ Failed to stage task command.')
    return
  }

  await sendMessage(
    chatId,
    `⚠️ <b>Confirm Dispatch</b>\n\n<b>Agent:</b> ${agent.name}\n<b>Task:</b> ${task}\n\nDo you want to send this task?`,
    'HTML',
    {
      inline_keyboard: [
        [
          { text: '🚀 Dispatch Now', callback_data: `confirm_dispatch:${command.id}` },
          { text: '❌ Cancel', callback_data: 'cancel:0' },
        ],
      ],
    }
  )
}

// ─── Command: /credits ────────────────────────────────────────────────────────

async function handleCredits(chatId: number, userId: string): Promise<void> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: usage } = await supabaseAdmin
    .from('credit_usage')
    .select('tokens_used, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  type UsageRow = { tokens_used: number; cost_usd: string | null }

  const totalTokens =
    (usage as UsageRow[] | null)?.reduce(
      (sum, row) => sum + (row.tokens_used ?? 0),
      0
    ) ?? 0

  const totalCost =
    (usage as UsageRow[] | null)?.reduce(
      (sum, row) => sum + parseFloat(row.cost_usd ?? '0'),
      0
    ) ?? 0

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, tokens_limit_monthly')
    .eq('id', userId)
    .single<Pick<Profile, 'plan' | 'tokens_limit_monthly'>>()

  const limit = profile?.tokens_limit_monthly ?? 100000
  const percent = Math.min(100, Math.round((totalTokens / limit) * 100))

  const filled = Math.round(percent / 10)
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const daysLeft = Math.ceil(
    (nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  await sendMessage(
    chatId,
    `💳 <b>Credits — ${now.toLocaleString('default', { month: 'long' })}</b>\n\n` +
      `Tokens used: <b>${totalTokens.toLocaleString()}</b> / ${limit.toLocaleString()}\n` +
      `<code>[${bar}] ${percent}%</code>\n\n` +
      `Est. cost: ₹${totalCost.toFixed(4)}\n` +
      `Resets in: ${daysLeft} days\n\n` +
      `Plan: ${(profile?.plan ?? 'free').toUpperCase()}`,
    'HTML'
  )
}

// ─── Command: /summary ────────────────────────────────────────────────────────

async function handleSummary(chatId: number, userId: string, plan?: string): Promise<void> {
  if (plan === 'free') {
    await sendMessage(
      chatId,
      '🔐 <b>Indie Feature</b>\n\n' +
        'Daily and on-demand summaries are only available on the <b>Indie</b> plan.\n\n' +
        'Upgrade at: agenthelm.online/dashboard/settings',
      'HTML'
    )
    return
  }
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Get all agents
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('id, name, status, last_ping, agent_type')
    .eq('user_id', userId)
    .eq('is_active', true)
    .returns<AgentRow[]>()

  if (!agents || agents.length === 0) {
    await sendMessage(chatId, '📊 No agents connected yet. Nothing to summarize.')
    return
  }

  // Count by status
  const running = agents.filter(a => a.status === 'running').length
  const stopped = agents.filter(a => a.status === 'stopped' || a.status === 'offline').length
  const errored = agents.filter(a => a.status === 'error').length
  const idle = agents.filter(a => a.status === 'idle').length

  // Get logs from last 24h
  const agentIds = agents.map(a => a.id)
  const { data: logs } = await supabaseAdmin
    .from('agent_logs')
    .select('level, agent_id')
    .in('agent_id', agentIds)
    .gte('created_at', twentyFourHoursAgo.toISOString())

  type LogEntry = { level: string; agent_id: string }
  const logEntries = (logs as LogEntry[] | null) ?? []
  const totalLogs = logEntries.length
  const errorLogs = logEntries.filter(l => l.level === 'error').length
  const warningLogs = logEntries.filter(l => l.level === 'warning').length

  // Get token usage from last 24h
  const { data: usage } = await supabaseAdmin
    .from('credit_usage')
    .select('tokens_used, cost_usd')
    .eq('user_id', userId)
    .gte('created_at', twentyFourHoursAgo.toISOString())

  type UsageRow = { tokens_used: number; cost_usd: string | null }
  const usageRows = (usage as UsageRow[] | null) ?? []
  const totalTokens = usageRows.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0)
  const totalCost = usageRows.reduce((sum, r) => sum + parseFloat(r.cost_usd ?? '0'), 0)

  // Get dispatched tasks from last 24h
  const { count: taskCount } = await supabaseAdmin
    .from('agent_tasks')
    .select('id', { count: 'exact', head: true })
    .in('agent_id', agentIds)
    .gte('created_at', twentyFourHoursAgo.toISOString())

  // Per-agent breakdown
  const agentBreakdown = agents
    .map(agent => {
      const statusEmoji = agent.status === 'running' ? '🟢'
        : agent.status === 'idle' ? '🟡'
        : agent.status === 'error' ? '⚠️' : '🔴'
      const agentLogs = logEntries.filter(l => l.agent_id === agent.id).length
      const agentErrors = logEntries.filter(l => l.agent_id === agent.id && l.level === 'error').length
      return `${statusEmoji} <b>${agent.name}</b> — ${agentLogs} logs${agentErrors > 0 ? `, ${agentErrors} errors` : ''}`
    })
    .join('\n')

  const summary =
    `📊 <b>24h Summary</b>\n\n` +
    `<b>Fleet Status:</b>\n` +
    `🟢 Running: ${running}  🟡 Idle: ${idle}  🔴 Stopped: ${stopped}  ⚠️ Errors: ${errored}\n\n` +
    `<b>Activity:</b>\n` +
    `📋 Total logs: ${totalLogs.toLocaleString()}\n` +
    `🔴 Errors: ${errorLogs}  🟡 Warnings: ${warningLogs}\n` +
    `📨 Tasks dispatched: ${taskCount ?? 0}\n\n` +
    `<b>Token Usage:</b>\n` +
    `🔢 Tokens: ${totalTokens.toLocaleString()}\n` +
    `💰 Est. cost: ₹${totalCost.toFixed(4)}\n\n` +
    `<b>Per Agent:</b>\n` +
    `${agentBreakdown}`

  await sendMessage(chatId, summary, 'HTML')
}

// ─── Command: /disconnect ─────────────────────────────────────────────────────

async function handleDisconnect(chatId: number, userId: string): Promise<void> {
  await supabaseAdmin
    .from('profiles')
    .update({ telegram_chat_id: null })
    .eq('id', userId)

  await sendMessage(
    chatId,
    '✅ Telegram disconnected from AgentHelm.\n\n' +
      'You will no longer receive alerts here.\n\n' +
      'Reconnect anytime from:\n' +
      'agenthelm.dev/dashboard/settings'
  )
}

// ─── Free-text NLU via Gemini ─────────────────────────────────────────────────

type GeminiIntent = {
  intent:
    | 'agents'
    | 'status'
    | 'logs'
    | 'run'
    | 'stop'
    | 'summary'
    | 'dispatch'
    | 'credits'
    | 'help'
    | 'unknown'
  agent_name: string | null
}

async function handleFreeText(
  chatId: number,
  userId: string,
  text: string,
  plan: string
): Promise<void> {
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('name')
    .eq('user_id', userId)
    .eq('is_active', true)

  const agentNames = (agents as Array<{ name: string }> | null)?.map(
    (a) => a.name
  ) ?? []

  try {
    const prompt = `
User sent this message to an AI agent dashboard bot: "${text}"

Their agents: ${agentNames.join(', ') || 'none connected'}

Available commands:
agents, status, logs, run, stop, summary, credits, help, disconnect

Classify the intent as exactly one of:
agents | status | logs | run | stop | summary | dispatch | credits | help | unknown

Also extract agent_name if a specific agent is mentioned, or null.

Reply with JSON only, no markdown:
{"intent": "...", "agent_name": "..." or null}
    `.trim()

    const { text: nvidiaText } = await callNvidia(prompt, true) // fast=true for Llama-3.1-8b

    const raw = nvidiaText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const parsed = JSON.parse(raw) as GeminiIntent
    const { intent, agent_name } = parsed

    switch (intent) {
      case 'agents':
        await handleAgents(chatId, userId)
        break
      case 'status':
        await handleStatus(chatId, userId, `/status ${agent_name ?? ''}`)
        break
      case 'logs':
        await handleLogs(chatId, userId, `/logs ${agent_name ?? ''}`)
        break
      case 'run':
        await handleRun(chatId, userId, `/run ${agent_name ?? ''}`)
        break
      case 'stop':
        await handleStop(chatId, userId, `/stop ${agent_name ?? ''}`)
        break
      case 'summary':
        await handleSummary(chatId, userId, plan)
        break
      case 'dispatch':
        await handleDispatch(chatId, userId, text, plan)
        break
      case 'credits':
        await handleCredits(chatId, userId)
        break
      case 'help':
        await handleHelp(chatId)
        break
      default:
        await sendMessage(
          chatId,
          "🤔 I didn't understand that.\n\n" +
            'Type /help to see available commands.\n\n' +
            "Or try: 'show my agents' or 'stop lead agent'"
        )
    }
  } catch (error) {
    console.error('Gemini intent error:', error)
    await sendMessage(
      chatId,
      "🤔 I didn't understand that.\n\nType /help to see all commands."
    )
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sendMessage(
  chatId: number,
  text: string,
  parseMode?: 'HTML' | 'Markdown',
  replyMarkup?: any
): Promise<void> {
  const body: Record<string, unknown> = { chat_id: chatId, text }
  if (parseMode) body.parse_mode = parseMode
  if (replyMarkup) body.reply_markup = replyMarkup

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      const err: unknown = await res.json()
      console.error('Telegram send error:', err)
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
      }
    )
  } catch (err) {
    console.error('Failed to answer callback query:', err)
  }
}

async function deleteMessage(chatId: number, messageId: number): Promise<void> {
  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
      }
    )
  } catch (err) {
    console.error('Failed to delete message:', err)
  }
}

async function getUserByTelegramId(chatId: number): Promise<Profile | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, plan, tokens_limit_monthly')
    .eq('telegram_chat_id', chatId.toString())
    .single<Profile>()
  return data
}

async function findAgent(
  userId: string,
  name: string
): Promise<{ id: string; name: string; status: string } | null> {
  let query = supabaseAdmin
    .from('agents')
    .select('id, name, status')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  const { data } = await query
    .order('last_ping', { ascending: false })
    .limit(1)

  return (
    (data?.[0] as { id: string; name: string; status: string } | undefined) ??
    null
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
