import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId
    
    // 1. Authenticate user session
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Query project globally using admin client to check existence
    const { data: globalProject } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .maybeSingle()

    if (!globalProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // 3. Verify user ownership
    if (globalProject.user_id !== authData.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Fetch metrics securely
    const [latestVersionResult, entriesResult, proposalsResult] = await Promise.all([
      supabaseAdmin
        .from('brain_versions')
        .select('version, created_at, files_changed_count, entries_added_count, entries_deprecated_count, evidence_summary')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('brain_entries')
        .select('category, confidence, evidence_score, source_type, created_at')
        .eq('project_id', projectId)
        .eq('status', 'active'),
      supabaseAdmin
        .from('knowledge_proposals')
        .select('build_status, evidence_score')
        .eq('project_id', projectId)
    ])

    const latestVersion = latestVersionResult.data
    const entries = entriesResult.data
    const proposals = proposalsResult.data

    // Calculate quality metrics
    let totalConfidence = 0
    let validEntriesCount = 0

    const categoryBreakdown: Record<string, number> = {}
    entries?.forEach(entry => {
      categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + 1
      if (entry.confidence != null) {
        totalConfidence += entry.confidence
        validEntriesCount++
      }
    })

    const avgConfidence = validEntriesCount > 0 ? Math.round(totalConfidence / validEntriesCount) : 100
    const evidenceBackedEntries = entries?.filter(entry => {
      const evidenceScore = typeof entry.evidence_score === 'number' ? entry.evidence_score : entry.confidence
      return evidenceScore >= 50 || ['git_commit', 'documentation', 'openapi', 'schema', 'human'].includes(entry.source_type)
    }).length || 0
    const trustScore = entries?.length ? Math.round((evidenceBackedEntries / entries.length) * 100) : 0

    const pendingProposals = proposals?.filter(c => c.build_status === 'pending').length || 0
    const reviewingProposals = proposals?.filter(c => c.build_status === 'reviewing').length || 0
    const mergedProposals = proposals?.filter(c => c.build_status === 'merged').length || 0
    const rejectedProposals = proposals?.filter(c => c.build_status === 'rejected').length || 0
    const lowEvidenceProposals = proposals?.filter(c => (c.evidence_score || 0) < 50 && c.build_status === 'merged').length || 0

    let qualityScore = 100
    if (avgConfidence < 80) qualityScore -= 10
    if (trustScore < 70) qualityScore -= 15
    if (reviewingProposals > 0) qualityScore -= 10
    if (rejectedProposals > mergedProposals * 0.2) qualityScore -= 10
    if (!categoryBreakdown['architecture']) qualityScore -= 15
    if (!categoryBreakdown['decisions']) qualityScore -= 10

    const actionItems: string[] = []
    if (reviewingProposals > 0) actionItems.push(`${reviewingProposals} proposal conflict${reviewingProposals === 1 ? '' : 's'} need review`)
    if (!categoryBreakdown['architecture']) actionItems.push('Architecture knowledge is missing')
    if (!categoryBreakdown['decisions']) actionItems.push('Decision history is missing')
    if (!categoryBreakdown['database']) actionItems.push('Database knowledge is missing')
    if (!categoryBreakdown['apis']) actionItems.push('API knowledge is missing')
    if (lowEvidenceProposals > 0) actionItems.push(`${lowEvidenceProposals} merged proposal${lowEvidenceProposals === 1 ? '' : 's'} have weak evidence`)

    return NextResponse.json({
      health: {
        quality_score: Math.max(0, qualityScore),
        trust_score: trustScore,
        average_confidence: avgConfidence,
        latest_version: latestVersion?.version || 0,
        last_updated: latestVersion?.created_at || null,
        latest_delta: {
          added: latestVersion?.entries_added_count || 0,
          deprecated: latestVersion?.entries_deprecated_count || 0,
          files_changed: latestVersion?.files_changed_count || 0
        },
        coverage: {
          architecture: !!categoryBreakdown['architecture'],
          decisions: !!categoryBreakdown['decisions'],
          database: !!categoryBreakdown['database'],
          apis: !!categoryBreakdown['apis']
        },
        action_items: actionItems
      },
      stats: {
        total_entries: entries?.length || 0,
        evidence_backed_entries: evidenceBackedEntries,
        category_breakdown: categoryBreakdown,
        proposals: {
          pending: pendingProposals,
          reviewing: reviewingProposals,
          merged: mergedProposals,
          rejected: rejectedProposals
        }
      }
    })

  } catch (err) {
    console.error('Project health API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
