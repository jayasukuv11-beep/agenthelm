import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/app/lib/supabase'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: authData, error: authErr } = await supabase.auth.getUser()

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { project_id, import_data } = body

    if (!project_id || !import_data) {
      return NextResponse.json({ error: 'project_id and import_data are required' }, { status: 400 })
    }

    // Verify project ownership
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id, brain_version')
      .eq('id', project_id)
      .eq('user_id', authData.user.id)
      .single()

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 })
    }

    const entries = Array.isArray(import_data.brain_entries) ? import_data.brain_entries : []
    let importedCount = 0

    // Fetch existing active entries to avoid direct duplicates
    const { data: existingEntries } = await supabase
      .from('brain_entries')
      .select('title, content_hash')
      .eq('project_id', project_id)
      .eq('status', 'active')

    const existingHashes = new Set((existingEntries || []).map(e => e.content_hash || e.title))

    const newEntries = []
    for (const entry of entries) {
      const contentHash = entry.content_hash || crypto.createHash('sha256')
        .update(`${entry.category}:${entry.title}:${JSON.stringify(entry.content || {})}`)
        .digest('hex')

      if (existingHashes.has(contentHash)) continue

      newEntries.push({
        project_id: project_id,
        category: entry.category || 'notes',
        title: entry.title || 'Imported Entry',
        content: entry.content || {},
        content_hash: contentHash,
        source_type: 'imported',
        source_path: 'brain_import.json',
        confidence: entry.confidence || 90,
        evidence_score: entry.evidence_score || 80,
        status: 'active',
        validity_status: 'CURRENT'
      })
    }

    if (newEntries.length > 0) {
      const { error: insertErr } = await supabase
        .from('brain_entries')
        .insert(newEntries)

      if (insertErr) throw insertErr
      importedCount = newEntries.length

      // Bump brain version
      await supabase
        .from('projects')
        .update({ brain_version: project.brain_version + 1 })
        .eq('id', project_id)

      await supabase
        .from('brain_versions')
        .insert({
          project_id: project_id,
          version: project.brain_version + 1,
          summary: `Imported ${importedCount} entries from external brain export`
        })
    }

    return NextResponse.json({
      success: true,
      entries_imported: importedCount,
      version_created: project.brain_version + (importedCount > 0 ? 1 : 0)
    })

  } catch (err: any) {
    console.error('Brain Import Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
