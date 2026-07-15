import { NextResponse } from 'next/server'
import { validateConnectKey, hasError } from '@/lib/sdk-auth'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

async function getProjectId(supabase: any, inputId: string): Promise<string> {
  const { data: agent } = await supabase
    .from('agents')
    .select('project_id')
    .eq('id', inputId)
    .single()

  if (agent && agent.project_id) {
    return agent.project_id
  }
  return inputId
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const body = await req.json().catch(() => ({}))

    if (!token && body.key) token = body.key

    const auth = await validateConnectKey(token)
    if (hasError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabaseAdmin, userId } = auth
    const { action, project, version, version_a, version_b, category, title } = body

    if (!action || !project) {
      return NextResponse.json({ error: 'Missing action or project parameter' }, { status: 400 })
    }

    const projectId = await getProjectId(supabaseAdmin, project)

    // Verify project belongs to user
    const { data: projectRec, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !projectRec) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (projectRec.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized project access' }, { status: 403 })
    }

    switch (action) {
      case 'log': {
        const { data: versions, error } = await supabaseAdmin
          .from('brain_versions')
          .select('*')
          .eq('project_id', projectId)
          .order('version', { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ versions: versions || [] })
      }

      case 'show': {
        if (version === undefined) {
          return NextResponse.json({ error: 'Missing version parameter' }, { status: 400 })
        }
        const { data: versionRec, error: vError } = await supabaseAdmin
          .from('brain_versions')
          .select('*')
          .eq('project_id', projectId)
          .eq('version', version)
          .single()

        if (vError || !versionRec) {
          return NextResponse.json({ error: `Version ${version} not found` }, { status: 404 })
        }

        const { data: entries, error: eError } = await supabaseAdmin
          .from('brain_entries')
          .select('*')
          .eq('brain_version_id', versionRec.id)

        if (eError) return NextResponse.json({ error: eError.message }, { status: 500 })

        return NextResponse.json({
          version: versionRec,
          entries: entries || []
        })
      }

      case 'diff': {
        if (version_a === undefined || version_b === undefined) {
          return NextResponse.json({ error: 'Missing version_a or version_b parameter' }, { status: 400 })
        }

        const { data: vARec } = await supabaseAdmin.from('brain_versions').select('id').eq('project_id', projectId).eq('version', version_a).single()
        const { data: vBRec } = await supabaseAdmin.from('brain_versions').select('id').eq('project_id', projectId).eq('version', version_b).single()

        if (!vARec || !vBRec) {
          return NextResponse.json({ error: 'Could not find one or both versions' }, { status: 404 })
        }

        const { data: entriesA } = await supabaseAdmin.from('brain_entries').select('*').eq('brain_version_id', vARec.id)
        const { data: entriesB } = await supabaseAdmin.from('brain_entries').select('*').eq('brain_version_id', vBRec.id)

        return NextResponse.json({
          entries_a: entriesA || [],
          entries_b: entriesB || []
        })
      }

      case 'blame': {
        if (!category || !title) {
          return NextResponse.json({ error: 'Missing category or title parameter' }, { status: 400 })
        }

        const { data: entries, error } = await supabaseAdmin
          .from('brain_entries')
          .select(`
            id,
            content,
            status,
            source_type,
            source_path,
            created_at,
            brain_versions (
              version,
              evolution_reason
            )
          `)
          .eq('project_id', projectId)
          .eq('category', category)
          .eq('title', title)
          .order('created_at', { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ entries: entries || [] })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
