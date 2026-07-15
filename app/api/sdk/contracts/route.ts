import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey, type AuthResult, hasError } from '@/lib/sdk-auth'
import { compileProposal } from '@/lib/brain-compiler'
import { checkRateLimit } from '@/lib/rate-limit'

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
    const authHeader = req.headers.get('authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const body = await req.json().catch(() => ({}))

    if (!token && body.key) token = body.key

    if (token) {
      if (!await checkRateLimit(token, 60, 60)) {
        return NextResponse.json({ error: 'Rate limit exceeded (60 per min)' }, { status: 429 })
      }
    }

    const auth = await validateConnectKey(token)
    if (hasError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // TypeScript narrowing: after the error check, we know supabaseAdmin exists
    const { supabaseAdmin, agentId: jwtAgentId } = auth
    const { project, content_hash, payload } = body
    const agentId = jwtAgentId ?? body.agent_id

    console.warn(`Deprecation Warning: /api/sdk/contracts called by agent [${agentId || 'unknown'}]. Use /api/sdk/proposals instead.`)

    if (!project || !content_hash || !payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Resolve project_id by name or ID (assuming `project` is name or ID)
    const { data: projectRecord, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .or(`id.eq.${project},name.eq.${project}`)
      .limit(1)
      .single()

    if (projectError || !projectRecord) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Backwards-compatible endpoint: legacy "contracts" are now knowledge proposals.
    const { data: proposal, error: insertError } = await supabaseAdmin
      .from('knowledge_proposals')
      .insert({
        project_id: projectRecord.id,
        agent_id: agentId,
        content_hash,
        summary: payload.summary,
        decisions: payload.decisions || [],
        files_modified: payload.files_modified || [],
        apis_affected: payload.apis_affected || [],
        db_changes: payload.db_changes || [],
        known_limitations: payload.known_limitations || [],
        next_steps: payload.next_steps || [],
        tests_passed: payload.tests_passed || false,
        human_reviewed: false,
        commit_sha: payload.commit_sha,
        branch: payload.branch,
        author: payload.author,
        build_status: 'pending',
        conflict_detected: false,
        evidence_score: 0
      })
      .select('id')
      .single()

    if (insertError) {
      // Handle unique constraint on content_hash
      if (insertError.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('knowledge_proposals')
          .select('id')
          .eq('content_hash', content_hash)
          .single()
        const response = NextResponse.json({
          contract_id: existing?.id,
          proposal_id: existing?.id,
          status: 'already_exists',
          deprecated: 'Use /api/sdk/proposals and publish_proposal().'
        })
        response.headers.set('X-Deprecation-Warning', '/api/sdk/contracts is deprecated. Use /api/sdk/proposals.')
        return response
      }
      throw insertError
    }

    // Trigger Brain Compiler asynchronously so the API stays fast.
    setImmediate(() => {
      compileProposal(proposal.id).catch(console.error)
    })

    // Log the event to ai_timeline
    await supabaseAdmin
      .from('ai_timeline_events')
      .insert({
        project_id: projectRecord.id,
        agent_id: agentId,
        event_type: 'proposal_submitted',
        title: `Proposal: ${payload.summary.substring(0, 50)}`,
        details: { contract_id: proposal.id, proposal_id: proposal.id, hash: content_hash, legacy_endpoint: true }
      })

    const response = NextResponse.json({
      contract_id: proposal.id,
      proposal_id: proposal.id,
      status: 'submitted',
      deprecated: 'Use /api/sdk/proposals and publish_proposal().'
    })
    response.headers.set('X-Deprecation-Warning', '/api/sdk/contracts is deprecated. Use /api/sdk/proposals.')
    return response

  } catch (err) {
    console.error('Contract publish error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}