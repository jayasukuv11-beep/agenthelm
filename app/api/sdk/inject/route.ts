import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { withSdkAuth, handleSdkOptions } from '@/lib/middleware/sdk-gateway'
import { semanticReRank } from '@/lib/brain/providers/sarvam-context'
import { z } from 'zod'

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
  validity_status?: string
}

interface RankedEntry extends BrainEntry {
  relevance_score: number
  token_estimate: number
}

type ContextPayload = Record<string, Array<Record<string, unknown>>>

const injectRouteSchema = z.object({
  project: z.string().optional(),
  project_id: z.string().optional(),
  agent_id: z.string().uuid().optional(),
  task_hint: z.string().optional(),
  trusted_only: z.boolean().default(true),
  max_context_tokens: z.number().int().min(100).max(32000).default(3000),
})

export const OPTIONS = handleSdkOptions

function tokenize(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9_/-]+/)
    .filter((token) => token.length > 2)
}

function estimateTokens(value: unknown) {
  return Math.ceil(JSON.stringify(value).length / 4)
}

function scoreEntryDeterministic(entry: BrainEntry, taskHint: string | null): RankedEntry {
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

  if (entry.validity_status === 'NEEDS_REVIEW') {
    relevance -= 10
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
        relevance_score: entry.relevance_score,
        validity_status: entry.validity_status
      }
    } as any

    if (entry.validity_status === 'NEEDS_REVIEW') {
      enrichedContent._warning = "This knowledge may be out of date due to recent project changes. Please review."
    }

    if (context[entry.category]) {
      context[entry.category].push(enrichedContent)
    } else {
      context[entry.category] = [enrichedContent]
    }
  }

  return { context, selected, usedTokens }
}

export const POST = withSdkAuth(
  {
    schema: injectRouteSchema,
    requireProjectId: true,
    isWrite: false
  },
  async (ctx) => {
    const { agentId, supabase, body, project } = ctx
    const { task_hint, trusted_only = true, max_context_tokens = 3000 } = body
    const tokenBudget = Math.min(Math.max(Number(max_context_tokens), 500), 12000)

    let query = supabase
      .from('brain_entries')
      .select('id, category, title, content, confidence, evidence_score, source_type, source_path, content_hash, created_at, validity_status')
      .eq('project_id', project!.id)
      .eq('status', 'active')

    if (trusted_only) {
      query = query.in('validity_status', ['CURRENT', 'NEEDS_REVIEW'])
    }

    const { data: entries, error } = await query
      .order('confidence', { ascending: false })
      .limit(200)

    if (error) throw error

    // 1. Deterministic scoring
    const deterministicRanked = dedupeEntries(
      ((entries || []) as BrainEntry[])
        .map((entry) => scoreEntryDeterministic(entry, typeof task_hint === 'string' ? task_hint : null))
        .sort((a, b) => b.relevance_score - a.relevance_score)
    )

    let finalRanked = deterministicRanked

    // 2. Sarvam Semantic Re-ranking for top 20 candidates (if task_hint provided)
    if (task_hint && deterministicRanked.length > 0) {
      const top20 = deterministicRanked.slice(0, 20)
      try {
        const semanticRankings = await semanticReRank(task_hint, top20)
        if (semanticRankings && semanticRankings.length > 0) {
          const scoreMap = new Map<string, number>()
          semanticRankings.forEach(r => scoreMap.set(r.entry_id, r.semantic_score))

          // Blend: 70% semantic score + 30% deterministic score
          finalRanked = deterministicRanked.map(entry => {
            const semScore = scoreMap.get(entry.id)
            if (semScore !== undefined) {
              const blended = Math.round(0.7 * semScore + 0.3 * entry.relevance_score)
              return { ...entry, relevance_score: blended }
            }
            return entry
          }).sort((a, b) => b.relevance_score - a.relevance_score)
        }
      } catch {
        // Fallback to deterministic ranking
      }
    }

    const { context, selected, usedTokens } = buildContext(finalRanked, tokenBudget)

    // Fire-and-forget: log timeline event and record time-saved metrics
    setImmediate(async () => {
      try {
        await supabase
          .from('ai_timeline_events')
          .insert({
            project_id: project!.id,
            agent_id: agentId,
            event_type: 'context_injected',
            title: `Injected v${project!.brain_version} Brain Context`,
            details: {
              task_hint,
              total_entries_considered: entries?.length || 0,
              total_entries_selected: selected.length,
              token_budget: tokenBudget,
              estimated_tokens: usedTokens
            }
          })

        // Record context injection for "Time Saved" ROI
        if (agentId) {
          void supabase
            .from('context_injections')
            .insert({
              project_id: project!.id,
              agent_id: agentId,
              task_hint: task_hint || null,
              entries_returned: selected.length,
              tokens_returned: usedTokens,
              estimated_seconds_saved: selected.length * 45
            })
        }
      } catch (err) {
        console.error('Failed to log context injection telemetry:', err)
      }
    })

    return NextResponse.json({
      context,
      brain_version: project!.brain_version,
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
          source_type: entry.source_type,
          validity_status: entry.validity_status
        }))
      }
    })
  }
)
