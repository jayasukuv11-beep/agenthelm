import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { compileProposal } from '@/lib/brain-compiler'
import { z } from 'zod'

const proposalPostSchema = z.object({
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
    architecture: z.any().optional(),
    known_limitations: z.any().optional(),
    next_steps: z.any().optional(),
    tests_passed: z.boolean().optional(),
    commit_sha: z.string().optional(),
    branch: z.string().optional(),
    author: z.string().optional(),
  })
})

const normalizeArray = (value: unknown): unknown[] => {
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
      return [parsed]
    } catch {
      return [{ text: value }]
    }
  }
  return [value]
}

export const OPTIONS = handleSdkOptions

export const POST = withSdkAuth(
  {
    schema: proposalPostSchema,
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
        decisions: normalizeArray(payload.decisions),
        files_modified: normalizeArray(payload.files_modified).map(f => typeof f === 'string' ? f : JSON.stringify(f)),
        apis_affected: normalizeArray(payload.apis_affected),
        db_changes: normalizeArray(payload.db_changes),
        architecture: normalizeArray(payload.architecture),
        known_limitations: normalizeArray(payload.known_limitations).map(f => typeof f === 'string' ? f : JSON.stringify(f)),
        next_steps: normalizeArray(payload.next_steps).map(f => typeof f === 'string' ? f : JSON.stringify(f)),
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
        const { data: existing } = await supabase
          .from('knowledge_proposals')
          .select('id')
          .eq('content_hash', content_hash)
          .single()
        return NextResponse.json({ proposal_id: existing?.id, status: 'already_exists' })
      }
      throw insertError
    }

    // Trigger Brain Compiler and await result
    await compileProposal(proposal.id)

    // Log timeline event
    await supabase
      .from('ai_timeline_events')
      .insert({
        project_id: project!.id,
        agent_id: agentId,
        event_type: 'proposal_submitted',
        title: `Proposal: ${payload.summary?.substring(0, 50)}`,
        details: { proposal_id: proposal.id, hash: content_hash }
      })

    return NextResponse.json({ proposal_id: proposal.id, status: 'submitted' })
  }
)
