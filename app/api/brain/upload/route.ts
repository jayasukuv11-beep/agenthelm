import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/app/lib/supabase'
import { extractFromDocument } from '@/lib/sarvam/document-intelligence'
import { compileProposal } from '@/lib/brain-compiler'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('project_id') as string | null

    if (!file || !projectId) {
      return NextResponse.json({ error: 'file and project_id are required' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', authData.user.id)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const entities = await extractFromDocument(buffer, file.type, file.name)

    let createdCount = 0
    let autoAppliedCount = 0
    let gatedCount = 0

    for (const entity of entities) {
      const contentHash = crypto.createHash('sha256')
        .update(`${projectId}:${file.name}:${entity.summary}:${Date.now()}`)
        .digest('hex')

      const { data: proposal, error: insertError } = await supabase
        .from('knowledge_proposals')
        .insert({
          project_id: projectId,
          agent_id: '00000000-0000-0000-0000-000000000000',
          content_hash: contentHash,
          summary: entity.summary,
          decisions: entity.category === 'decisions' ? [{ fact: entity.summary, details: entity.key_facts }] : [],
          files_modified: [file.name],
          apis_affected: entity.category === 'apis' ? [{ facts: entity.key_facts }] : [],
          db_changes: entity.category === 'database' ? [{ tables: entity.key_facts }] : [],
          architecture: entity.category === 'architecture' ? [{ details: entity.key_facts }] : [],
          build_status: 'pending',
          evidence_score: 85,
          tests_passed: true,
          human_reviewed: false
        })
        .select('id')
        .single()

      if (insertError) continue
      createdCount++

      const compileResult = await compileProposal(proposal.id)
      if (compileResult?.outcome === 'merged') {
        autoAppliedCount++
      } else if (compileResult?.outcome === 'reviewing') {
        gatedCount++
      }
    }

    // Record usage (fire-and-forget)
    void supabase
      .from('usage_events')
      .insert({
        user_id: authData.user.id,
        project_id: projectId,
        event_type: 'doc_intelligence',
        credits_cost: 3,
        metadata: { filename: file.name, entities_extracted: entities.length }
      })

    return NextResponse.json({
      success: true,
      entities_extracted: entities.length,
      proposals_created: createdCount,
      proposals_auto_applied: autoAppliedCount,
      proposals_gated: gatedCount
    })

  } catch (err: any) {
    console.error('Document upload error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
