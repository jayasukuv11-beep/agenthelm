#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

async function getProjectId(supabase: any, inputId: string): Promise<string> {
  // Check if inputId is an agent_id
  const { data: agent } = await supabase
    .from('agents')
    .select('project_id')
    .eq('id', inputId)
    .single()

  if (agent && agent.project_id) {
    return agent.project_id
  }
  
  // Otherwise assume it is a project_id
  return inputId
}

async function runLog(supabase: any, projectId: string) {
  const { data: versions, error } = await supabase
    .from('brain_versions')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false })

  if (error) {
    console.error('Error fetching logs:', error.message)
    return
  }

  if (!versions || versions.length === 0) {
    console.log('No brain versions found for this project.')
    return
  }

  console.log(`\n=== Brain Version History (Project: ${projectId}) ===`)
  for (const v of versions) {
    console.log(`\nVersion: ${v.version}`)
    console.log(`Commit/ID: ${v.id}`)
    console.log(`Date: ${new Date(v.created_at).toLocaleString()}`)
    console.log(`Reason: ${v.evolution_reason}`)
    if (v.built_from_proposals && v.built_from_proposals.length > 0) {
      console.log(`Proposals: ${v.built_from_proposals.join(', ')}`)
      const { data: proposals } = await supabase
        .from('knowledge_proposals')
        .select('id, summary, agent_id')
        .in('id', v.built_from_proposals)
      if (proposals && proposals.length > 0) {
        for (const p of proposals) {
          console.log(`  - Proposal [${p.id}]: "${p.summary}" (by agent: ${p.agent_id})`)
        }
      }
    }
    console.log(`Files Changed Count: ${v.files_changed_count || 0}`)
    console.log(`APIs Changed Count: ${v.apis_changed_count || 0}`)
    console.log('-'.repeat(40))
  }
}

async function runShow(supabase: any, projectId: string, versionNumberStr: string) {
  const versionNum = parseInt(versionNumberStr, 10)
  if (isNaN(versionNum)) {
    console.error('Error: Version must be an integer.')
    return
  }

  const { data: version, error: vError } = await supabase
    .from('brain_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('version', versionNum)
    .single()

  if (vError || !version) {
    console.error(`Version ${versionNum} not found.`)
    return
  }

  console.log(`\n=== Brain Version ${versionNum} Details ===`)
  console.log(`Commit/ID: ${version.id}`)
  console.log(`Date: ${new Date(version.created_at).toLocaleString()}`)
  console.log(`Reason: ${version.evolution_reason}`)
  console.log(`Files Changed: ${version.files_changed_count}`)
  console.log(`APIs Changed: ${version.apis_changed_count}`)

  const { data: entries, error: eError } = await supabase
    .from('brain_entries')
    .select('*')
    .eq('brain_version_id', version.id)

  if (eError) {
    console.error('Error fetching entries:', eError.message)
    return
  }

  console.log(`\nEntries changed/added in this version (${entries?.length || 0}):`)
  for (const entry of (entries || [])) {
    console.log(`\n[${entry.category.toUpperCase()}] ${entry.title}`)
    console.log(`Source: ${entry.source_type} (${entry.source_path || 'N/A'})`)
    console.log(`Content: ${JSON.stringify(entry.content, null, 2)}`)
  }
}

async function runDiff(supabase: any, projectId: string, versionAStr: string, versionBStr: string) {
  const verA = parseInt(versionAStr, 10)
  const verB = parseInt(versionBStr, 10)
  if (isNaN(verA) || isNaN(verB)) {
    console.error('Error: Versions must be integers.')
    return
  }

  const { data: vARec } = await supabase.from('brain_versions').select('id').eq('project_id', projectId).eq('version', verA).single()
  const { data: vBRec } = await supabase.from('brain_versions').select('id').eq('project_id', projectId).eq('version', verB).single()

  if (!vARec || !vBRec) {
    console.error('Could not find one or both versions.')
    return
  }

  const { data: entriesA } = await supabase.from('brain_entries').select('*').eq('brain_version_id', vARec.id)
  const { data: entriesB } = await supabase.from('brain_entries').select('*').eq('brain_version_id', vBRec.id)

  const mapA = new Map<string, any>((entriesA || []).map((e: any) => [`${e.category}:${e.title}`, e]))
  const mapB = new Map<string, any>((entriesB || []).map((e: any) => [`${e.category}:${e.title}`, e]))

  console.log(`\n=== Diff Version ${verA} -> ${verB} ===`)

  mapB.forEach((eb, key) => {
    const ea = mapA.get(key)
    if (!ea) {
      console.log(`\n[ADDED] [${eb.category.toUpperCase()}] ${eb.title}`)
      console.log(`+ ${JSON.stringify(eb.content, null, 2).replace(/\n/g, '\n+ ')}`)
    } else if (ea.content_hash !== eb.content_hash) {
      console.log(`\n[MODIFIED] [${eb.category.toUpperCase()}] ${eb.title}`)
      console.log(`- ${JSON.stringify(ea.content, null, 2).replace(/\n/g, '\n- ')}`)
      console.log(`+ ${JSON.stringify(eb.content, null, 2).replace(/\n/g, '\n+ ')}`)
    }
  })

  mapA.forEach((ea, key) => {
    if (!mapB.has(key)) {
      console.log(`\n[REMOVED/DEPRECATED] [${ea.category.toUpperCase()}] ${ea.title}`)
      console.log(`- ${JSON.stringify(ea.content, null, 2).replace(/\n/g, '\n- ')}`)
    }
  })
}

async function runBlame(supabase: any, projectId: string, category: string, title: string) {
  const { data: entries, error } = await supabase
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

  if (error) {
    console.error('Error blaming:', error.message)
    return
  }

  if (!entries || entries.length === 0) {
    console.log(`No entries found for category "${category}" and title "${title}".`)
    return
  }

  console.log(`\n=== Blame History for [${category.toUpperCase()}] ${title} ===`)
  for (const entry of entries) {
    const ver = entry.brain_versions
    const versionNum = ver ? (ver as any).version : 'Unknown'
    const reason = ver ? (ver as any).evolution_reason : 'N/A'
    console.log(`\nVersion: ${versionNum} (${new Date(entry.created_at).toLocaleString()})`)
    console.log(`Reason: ${reason}`)
    console.log(`Status: ${entry.status}`)
    console.log(`Source: ${entry.source_type} (${entry.source_path || 'N/A'})`)
    console.log(`Content: ${JSON.stringify(entry.content, null, 2)}`)
    console.log('-'.repeat(40))
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log('Usage: agenthelm <command> [args]')
    console.log('Commands:')
    console.log('  log <agent_id_or_project_id>')
    console.log('  show <agent_id_or_project_id> <version>')
    console.log('  diff <agent_id_or_project_id> <version_a> <version_b>')
    console.log('  blame <agent_id_or_project_id> <category> <title>')
    process.exit(0)
  }

  const inputId = args[1]
  if (!inputId) {
    console.error('Error: Must provide agent_id or project_id.')
    process.exit(1)
  }

  const projectId = await getProjectId(supabase, inputId)

  try {
    switch (command) {
      case 'log':
        await runLog(supabase, projectId)
        break
      case 'show':
        if (!args[2]) {
          console.error('Error: Must specify version number.')
          process.exit(1)
        }
        await runShow(supabase, projectId, args[2])
        break
      case 'diff':
        if (!args[2] || !args[3]) {
          console.error('Error: Must specify both version_a and version_b.')
          process.exit(1)
        }
        await runDiff(supabase, projectId, args[2], args[3])
        break
      case 'blame':
        if (!args[2] || !args[3]) {
          console.error('Error: Must specify category and title.')
          process.exit(1)
        }
        await runBlame(supabase, projectId, args[2], args[3])
        break
      default:
        console.error(`Unknown command: ${command}`)
        process.exit(1)
    }
  } catch (err: any) {
    console.error('Execution error:', err.message || err)
    process.exit(1)
  }
}

main()
