import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey, issueAgentToken } from '@/lib/sdk-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { resolveProject } from '@/lib/project-resolver'

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
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { key, name, agent_type, version, status, error_message, project, agent_id } = body

    if (!await checkRateLimit(key, 6, 60)) {
      return NextResponse.json({ error: 'Rate limit exceeded (6 per min)' }, { status: 429 })
    }

    const auth: any = await validateConnectKey(key)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { userId, supabaseAdmin } = auth
    const { getUserUsage } = await import('@/lib/usage')
    const usage = await getUserUsage(userId)

    let existingAgent = null

    if (agent_id) {
      const { data } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('id', agent_id)
        .eq('user_id', userId)
        .maybeSingle()
      existingAgent = data
    }

    // Deduplicate by name AND agent_type to allow different agent types (Claude vs Codex) to coexist
    if (!existingAgent && name) {
      const { data } = await supabaseAdmin!
        .from('agents')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .eq('agent_type', agent_type || 'node')
        .maybeSingle()
      existingAgent = data
    }

    let agentId = existingAgent?.id

    // Resolve project if provided
    let projectId: string | null = null
    if (project) {
      const { data: projectRecord } = await resolveProject(supabaseAdmin!, project)
      projectId = projectRecord?.id || null
    }

    if (agentId) {
      // Update existing
      await supabaseAdmin!
        .from('agents')
        .update({
          status,
          agent_type,
          version,
          error_message: error_message || null,
          last_ping: new Date().toISOString(),
          project_id: projectId
        })
        .eq('id', agentId)
    } else {
      // Create new - ENFORCE LIMIT
      if (usage.agentCount >= usage.agentLimit) {
        return NextResponse.json({
          error: 'agent_limit_reached',
          message: `Your current plan (${usage.plan}) is limited to ${usage.agentLimit} agents. Upgrade to connect more.`,
          upgrade_url: '/dashboard/settings'
        }, { status: 402 })
      }

      const { data: newAgent, error: insertError } = await supabaseAdmin!
        .from('agents')
        .insert({
          user_id: userId,
          name,
          status,
          agent_type,
          version,
          error_message: error_message || null,
          last_ping: new Date().toISOString(),
          project_id: projectId
        })
        .select()
        .single()

      if (insertError) throw insertError
      agentId = newAgent.id
    }

    // Issue the short-lived JWT for the Handshake Protocol
    const agentToken = await issueAgentToken(userId, agentId, auth.plan)

    // Phase 5: Fetch tool permissions
    const { data: permissions } = await supabaseAdmin!
      .from('agent_tool_permissions')
      .select('allowed_tools, block_mode')
      .eq('agent_id', agentId)
      .single()

    return NextResponse.json({ 
      agent_id: agentId, 
      user_id: userId,
      plan: auth.plan,
      success: true,
      agent_token: agentToken,
      permissions: permissions || null
    })

  } catch (err: any) {
    console.error('Ping error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
