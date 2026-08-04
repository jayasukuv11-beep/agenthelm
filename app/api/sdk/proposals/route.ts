import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { validateConnectKey } from '@/lib/sdk-auth'
import { compileProposal } from '@/lib/brain-compiler'
import { checkRateLimit } from '@/lib/rate-limit'
import { resolveProject } from '@/lib/project-resolver'

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

    const auth: any = await validateConnectKey(token)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin, agentId } = auth as any
    const { project, content_hash, payload } = body

    if (!project || !content_hash || !payload) {
      return NextResponse.json({ error: 'Missing required fields: project, content_hash, payload' }, { status: 400 })
    }

    // 1. Resolve project_id (supports UUID or Project Name)
    const { data: projectRecord, error: projectError } = await resolveProject(supabaseAdmin, project)

    if (projectError || !projectRecord) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Insert Proposal into knowledge_proposals
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
        human_reviewed: payload.author === 'mcp-agent',
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
      if (insertError.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('knowledge_proposals')
          .select('id')
          .eq('content_hash', content_hash)
          .single()
        return NextResponse.json({ proposal_id: existing?.id, status: 'already_exists' })
      }
      throw insertError
    }

    // 3. Trigger Brain Compiler and await result
    const compileResult = await compileProposal(proposal.id)


    // 4. Log timeline event
    await supabaseAdmin
      .from('ai_timeline_events')
      .insert({
        project_id: projectRecord.id,
        agent_id: agentId,
        event_type: 'proposal_submitted',
        title: `Proposal: ${payload.summary?.substring(0, 50)}`,
        details: { proposal_id: proposal.id, hash: content_hash }
      })

    return NextResponse.json({ proposal_id: proposal.id, status: 'submitted' })

  } catch (err) {
    console.error('Proposal submit error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
