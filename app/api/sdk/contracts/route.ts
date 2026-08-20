import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { compileProposal } from '@/lib/brain-compiler'
import { z } from 'zod'

const contractsPostSchema = z.object({
  project: z.string().optional(),
  project_id: z.string().optional(),
  agent_id: z.string().uuid().optional(),
  content_hash: z.string().min(1),
  payload: z.object({
    summary: z.string().min(1),
    decisions: z.any().optional(),
    files_modified: z.any().optional(),
    apis_affected: z.any().optional(),
    db_changes: z.any().optional(),
    known_limitations: z.any().optional(),
    next_steps: z.any().optional(),
    tests_passed: z.boolean().optional(),
    commit_sha: z.string().optional(),
    branch: z.string().optional(),
    author: z.string().optional(),
  })
})

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: contractsPostSchema,
    requireProjectId: true,
    requireAgentId: true,
    isWrite: true
  },
  async (ctx) => {
    const { agentId, supabase, body, project } = ctx
    const { content_hash, payload } = body

    const { data: proposal, error: insertError } = await supabase
      .from('knowledge_proposals')
      .insert({
        project_id: project!.id,
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
      if (insertError.code === '23505') {
        const { data: existing } = await supabase
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

    setImmediate(() => {
      compileProposal(proposal.id).catch(console.error)
    })

    await supabase
      .from('ai_timeline_events')
      .insert({
        project_id: project!.id,
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
  }
)