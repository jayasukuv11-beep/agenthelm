import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', authData.user.id)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
    }

    const [entriesReq, versionsReq, policyReq, proposalsReq] = await Promise.all([
      supabase.from('brain_entries').select('*').eq('project_id', projectId),
      supabase.from('brain_versions').select('*').eq('project_id', projectId),
      supabase.from('project_policies').select('*').eq('project_id', projectId).maybeSingle(),
      supabase.from('knowledge_proposals').select('*').eq('project_id', projectId).limit(100)
    ])

    const exportPayload = {
      schema_version: '1.0',
      project: {
        id: project.id,
        name: project.name,
        brain_version: project.brain_version,
        exported_at: new Date().toISOString()
      },
      policy_config: policyReq.data || null,
      brain_versions: versionsReq.data || [],
      brain_entries: entriesReq.data || [],
      knowledge_proposals: proposalsReq.data || [],
      stats: {
        total_entries: (entriesReq.data || []).length,
        total_versions: (versionsReq.data || []).length,
        total_proposals: (proposalsReq.data || []).length
      }
    }

    const jsonStr = JSON.stringify(exportPayload, null, 2)
    const filename = `agenthelm-brain-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-v${project.brain_version}.json`

    return new Response(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (err: any) {
    console.error('Brain Export Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
