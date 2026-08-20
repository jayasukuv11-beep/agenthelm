import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { sendTelegramToUser } from '@/lib/telegram'
import { z } from 'zod'

const executionPostSchema = z.object({
  agent_id: z.string().uuid(),
  task_id: z.string().optional(),
  tool_name: z.string().min(1),
  classification: z.string().min(1),
  idempotency_key: z.string().optional(),
  input_hash: z.string().optional(),
  input_preview: z.string().optional(),
  confirm_channel: z.string().default('telegram'),
  retry_count: z.number().int().min(0).default(0),
  max_retries: z.number().int().min(0).default(3),
  status: z.string().default('executed'),
})

const executionPatchSchema = z.object({
  execution_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected'])
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: executionPostSchema,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { userId, agentId, supabase, body } = ctx
    const {
      task_id,
      tool_name,
      classification,
      idempotency_key,
      input_hash,
      input_preview,
      confirm_channel = 'telegram',
      retry_count = 0,
      max_retries = 3,
      status = 'executed',
    } = body

    // For irreversible: check if approval already exists for this input_hash
    if (classification === 'irreversible' && input_hash) {
      const { data: existing } = await supabase
        .from('tool_executions')
        .select('id, status')
        .eq('agent_id', agentId)
        .eq('input_hash', input_hash)
        .in('status', ['pending_approval', 'approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json({
          execution_id: existing[0].id,
          status: existing[0].status,
          already_exists: true,
        })
      }
    }

    const { data: execution, error } = await supabase
      .from('tool_executions')
      .insert({
        agent_id: agentId,
        task_id: task_id || null,
        tool_name,
        classification,
        idempotency_key: idempotency_key || null,
        input_hash: input_hash || null,
        input_preview: input_preview || null,
        confirm_channel,
        retry_count,
        max_retries,
        status,
      })
      .select('id, status')
      .single()

    if (error) throw error

    if (execution.status === 'pending_approval') {
      setImmediate(async () => {
        try {
          const [agentRes, profileRes] = await Promise.all([
            supabase.from('agents').select('name').eq('id', agentId).single(),
            supabase.from('profiles').select('slack_webhook_url, discord_webhook_url').eq('id', userId).maybeSingle()
          ])

          const agentName = agentRes.data?.name || 'Agent'
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agenthelm.online'

          const message = `[Action Required: ${agentName}]\n\n` +
            `The agent is requesting approval to run an @irreversible tool:\n\n` +
            `Tool: ${tool_name}\n` +
            `${input_preview ? `Preview: ${input_preview}\n` : ''}\n` +
            `Use the buttons below or respond via Telegram.`
          
          await sendTelegramToUser(userId, message, 'HTML', {
            inline_keyboard: [
              [
                { text: 'Approve', callback_data: `approve_tool:${execution.id}` },
                { text: 'Reject', callback_data: `reject_tool:${execution.id}` },
              ]
            ]
          }).catch(err => console.error('Telegram error:', err))

          if (profileRes.data?.slack_webhook_url) {
            const { sendSlackApprovalAlert } = await import('@/lib/notifications')
            await sendSlackApprovalAlert(profileRes.data.slack_webhook_url, {
              interventionId: execution.id,
              agentName,
              actionName: tool_name,
              payload: { preview: input_preview || 'No details' },
              confirmType: confirm_channel,
              baseUrl
            })
          }

          if (profileRes.data?.discord_webhook_url) {
            const { sendDiscordApprovalAlert } = await import('@/lib/notifications')
            await sendDiscordApprovalAlert(profileRes.data.discord_webhook_url, {
              interventionId: execution.id,
              agentName,
              actionName: tool_name,
              payload: { preview: input_preview || 'No details' },
              confirmType: confirm_channel,
              baseUrl
            })
          }
        } catch (tgErr) {
          console.error('Multi-channel Safety Bridge error:', tgErr)
        }
      })
    }

    return NextResponse.json({
      success: true,
      execution_id: execution.id,
      status: execution.status,
    })
  }
)

export const GET = withSdkAuth(
  {
    isWrite: false
  },
  async (ctx, req) => {
    const { supabase, userId } = ctx
    const { searchParams } = new URL(req.url)
    const agent_id = searchParams.get('agent_id')
    const input_hash = searchParams.get('input_hash')
    const execution_id = searchParams.get('execution_id')

    if (!agent_id && !execution_id) {
      return NextResponse.json(
        { error: 'agent_id or execution_id is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('tool_executions')
      .select('id, status, tool_name, classification, input_preview, created_at, agent_id, agents!inner(user_id)')
      .eq('agents.user_id', userId)

    if (execution_id) {
      query = query.eq('id', execution_id)
    } else if (agent_id) {
      query = query.eq('agent_id', agent_id)
      if (input_hash) {
        query = query.eq('input_hash', input_hash)
      }
      query = query.order('created_at', { ascending: false })
    }

    const { data: executions, error } = await query.limit(1)
    if (error) throw error
    const execution = executions?.[0] || null

    return NextResponse.json({
      status: execution?.status || 'not_found',
      execution,
    })
  }
)

export const PATCH = withSdkAuth(
  {
    schema: executionPatchSchema,
    isWrite: true
  },
  async (ctx) => {
    const { supabase, userId, body } = ctx
    const { execution_id, status } = body

    const { data: executionCheck } = await supabase
      .from('tool_executions')
      .select('id, agents!inner(user_id)')
      .eq('id', execution_id)
      .eq('agents.user_id', userId)
      .single()

    if (!executionCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('tool_executions')
      .update({ status })
      .eq('id', execution_id)
      .eq('status', 'pending_approval')
      .select('id, status')
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      execution_id: data.id,
      status: data.status,
    })
  }
)
