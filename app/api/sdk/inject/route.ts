import { NextResponse } from 'next/server'
import { validateConnectKey, hasError } from '@/lib/sdk-auth'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

interface BrainEntry {
  id: string
  category: string
  title: string
  content: Record<string, unknown>
  confidence: number | null
  evidence_score?: number | null
  source_type?: string | null
  source_path?: string | null
  content_hash?: string | null
  created_at?: string | null
}

interface RankedEntry extends BrainEntry {
  relevance_score: number
  token_estimate: number
}

type ContextPayload = Record<string, Array<Record<string, unknown>>>

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

function tokenize(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9_/-]+/)
    .filter((token) => token.length > 2)
}

function estimateTokens(value: unknown) {
  return Math.ceil(JSON.stringify(value).length / 4)
}

function scoreEntry(entry: BrainEntry, taskHint: string | null): RankedEntry {
  const taskTokens = new Set(tokenize(taskHint || ''))
  const searchable = `${entry.category} ${entry.title} ${JSON.stringify(entry.content)}`.toLowerCase()
  let relevance = 0

  taskTokens.forEach((token) => {
    if (searchable.includes(token)) relevance += 10
    if (entry.title.toLowerCase().includes(token)) relevance += 15
    if (entry.category.toLowerCase().includes(token)) relevance += 5
  })

  relevance += Math.round((entry.evidence_score ?? entry.confidence ?? 50) / 10)

  if (entry.source_type && ['git_commit', 'documentation', 'openapi', 'schema', 'human'].includes(entry.source_type)) {
    relevance += 5
  }

  return {
    ...entry,
    relevance_score: relevance,
    token_estimate: estimateTokens(entry.content)
  }
}

function dedupeEntries(entries: RankedEntry[]) {
  const seen = new Set<string>()
  const deduped: RankedEntry[] = []

  entries.forEach((entry) => {
    const key = entry.content_hash || `${entry.category}:${entry.title.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    deduped.push(entry)
  })

  return deduped
}

function buildContext(entries: RankedEntry[], tokenBudget: number) {
  const context: ContextPayload = {
    architecture: [],
    decisions: [],
    apis: [],
    database: [],
    standards: []
  }

  const selected: RankedEntry[] = []
  let usedTokens = 0

  for (const entry of entries) {
    if (usedTokens + entry.token_estimate > tokenBudget && selected.length > 0) {
      continue
    }

    selected.push(entry)
    usedTokens += entry.token_estimate

    const enrichedContent = {
      ...entry.content,
      _source: {
        title: entry.title,
        category: entry.category,
        confidence: entry.confidence,
        evidence_score: entry.evidence_score,
        source_type: entry.source_type,
        source_path: entry.source_path,
        relevance_score: entry.relevance_score
      }
    }

    if (context[entry.category]) {
      context[entry.category].push(enrichedContent)
    } else {
      context[entry.category] = [enrichedContent]
    }
  }

  return { context, selected, usedTokens }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const body = await req.json().catch(() => ({}))
    
    if (!token && body.key) token = body.key

    if (token) {
      if (!await checkRateLimit(token, 120, 60)) {
        return NextResponse.json({ error: 'Rate limit exceeded (120 per min)' }, { status: 429 })
      }
    }

    const auth = await validateConnectKey(token)
    if (hasError(auth)) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { supabaseAdmin } = auth
    const agentId = 'agentId' in auth ? auth.agentId : body.agent_id
    const { project, task_hint } = body
    const tokenBudget = Math.min(Math.max(Number(body.max_context_tokens || 3000), 500), 12000)

    if (!project) {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 })
    }

    const { data: projectRecord } = await supabaseAdmin
      .from('projects')
      .select('id, brain_version')
      .or(`id.eq.${project},name.eq.${project}`)
      .limit(1)
      .single()

    if (!projectRecord) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: entries, error } = await supabaseAdmin
      .from('brain_entries')
      .select('id, category, title, content, confidence, evidence_score, source_type, source_path, content_hash, created_at')
      .eq('project_id', projectRecord.id)
      .eq('status', 'active')
      .order('confidence', { ascending: false })
      .limit(200)

    if (error) throw error

    const ranked = dedupeEntries(
      ((entries || []) as BrainEntry[])
        .map((entry) => scoreEntry(entry, typeof task_hint === 'string' ? task_hint : null))
        .sort((a, b) => b.relevance_score - a.relevance_score)
    )

    const { context, selected, usedTokens } = buildContext(ranked, tokenBudget)

    await supabaseAdmin
      .from('ai_timeline_events')
      .insert({
        project_id: projectRecord.id,
        agent_id: agentId,
        event_type: 'context_injected',
        title: `Injected v${projectRecord.brain_version} Brain Context`,
        details: {
          task_hint,
          total_entries_considered: entries?.length || 0,
          total_entries_selected: selected.length,
          token_budget: tokenBudget,
          estimated_tokens: usedTokens
        }
      })

    return NextResponse.json({
      context,
      brain_version: projectRecord.brain_version,
      selection: {
        entries_considered: entries?.length || 0,
        entries_selected: selected.length,
        estimated_tokens: usedTokens,
        token_budget: tokenBudget,
        sources: selected.map((entry) => ({
          id: entry.id,
          title: entry.title,
          category: entry.category,
          relevance_score: entry.relevance_score,
          evidence_score: entry.evidence_score,
          source_type: entry.source_type
        }))
      }
    })

  } catch (err) {
    console.error('Context inject error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
