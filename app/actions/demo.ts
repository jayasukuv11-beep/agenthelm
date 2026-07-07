'use server'

import { createClient } from '@/app/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function loadDemoData() {
  const supabase = await createClient()

  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 2. Create a demo project if it doesn't exist
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'AgentHelm Platform')
    .limit(1)
    .single()

  let projectId: string
  if (existingProject) {
    projectId = existingProject.id
  } else {
    const { data: project, error: projectErr } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: 'AgentHelm Platform',
        description: 'Main development project for AgentHelm platform and Project Brain',
        repo_url: 'github.com/agenthelm/agentdock',
        brain_version: 1
      })
      .select()
      .single()

    if (projectErr) throw projectErr
    projectId = project.id
  }

  // 3. Create a demo agent linked to the project
  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .insert({
      user_id: user.id,
      project_id: projectId,
      name: "Demo Analytics Agent",
      status: "running",
      agent_type: "python",
      version: "1.0.0-demo",
      last_ping: new Date().toISOString(),
    })
    .select()
    .single()

  if (agentErr) throw agentErr

  // 4. Create a brain version
  const { data: existingVersion } = await supabase
    .from('brain_versions')
    .select('id')
    .eq('project_id', projectId)
    .eq('version', 1)
    .limit(1)
    .single()

  let versionId: string
  if (existingVersion) {
    versionId = existingVersion.id
  } else {
    const { data: brainVersion, error: versionErr } = await supabase
      .from('brain_versions')
      .insert({
        project_id: projectId,
        version: 1,
        evolution_reason: 'Initial compile of AgentHelm codebase schema and specs',
        files_changed_count: 12,
        apis_changed_count: 4,
        entries_added_count: 4,
        entries_deprecated_count: 0,
        evidence_summary: { confidence: 95, sources: ['documentation', 'git_commit'] }
      })
      .select()
      .single()

    if (versionErr) throw versionErr
    versionId = brainVersion.id
  }

  // 5. Create some active brain entries
  const demoEntries = [
    {
      project_id: projectId,
      brain_version_id: versionId,
      category: 'architecture',
      title: 'Core Agent-to-Brain Loop',
      content: { description: 'Agent starts -> gets context -> works -> proposes knowledge -> Brain Compiler validates/merges -> Project Brain updated.' },
      content_hash: 'hash_arch_001',
      status: 'active',
      tags: ['architecture', 'loop'],
      source_type: 'documentation',
      source_path: 'docs/architecture.md',
      confidence: 98
    },
    {
      project_id: projectId,
      brain_version_id: versionId,
      category: 'decisions',
      title: 'Authentication: JWT with HTTP-only cookies',
      content: { description: 'Use JWT tokens stored in HTTP-only cookies for client authentication. Replay attacks are mitigated with nonce checks.' },
      content_hash: 'hash_dec_001',
      status: 'active',
      tags: ['auth', 'jwt'],
      source_type: 'human',
      source_path: 'decisions/001-auth-jwt.md',
      confidence: 95
    },
    {
      project_id: projectId,
      brain_version_id: versionId,
      category: 'database',
      title: 'Supabase Postgres Schema',
      content: { description: 'Supabase schema containing profiles, agents, projects, brain_versions, brain_entries, and knowledge_proposals.' },
      content_hash: 'hash_db_001',
      status: 'active',
      tags: ['postgres', 'schema'],
      source_type: 'schema',
      source_path: 'supabase/migrations/031_project_brain.sql',
      confidence: 100
    },
    {
      project_id: projectId,
      brain_version_id: versionId,
      category: 'apis',
      title: 'Agent SDK API v1 Specifications',
      content: { description: 'API routes under /api/sdk/* including ping, proposals, inject, presence, and logs.' },
      content_hash: 'hash_api_001',
      status: 'active',
      tags: ['api', 'sdk'],
      source_type: 'openapi',
      source_path: 'docs/openapi.yaml',
      confidence: 92
    }
  ]

  // Insert brain entries if they don't exist
  for (const entry of demoEntries) {
    const { data: existingEntry } = await supabase
      .from('brain_entries')
      .select('id')
      .eq('project_id', projectId)
      .eq('title', entry.title)
      .limit(1)
      .single()

    if (!existingEntry) {
      const { error: entryErr } = await supabase
        .from('brain_entries')
        .insert(entry)
      if (entryErr) throw entryErr
    }
  }

  // 6. Create some knowledge proposals
  const demoProposals = [
    {
      project_id: projectId,
      agent_id: agent.id,
      content_hash: 'proposal_hash_001',
      summary: 'Migrate authentication from JWT to Session Cookies',
      decisions: ['Use cookie session IDs mapped to Redis backend.'],
      files_modified: ['lib/auth.ts', 'middleware.ts'],
      apis_affected: [{ route: '/api/auth/login', change: 'returns session cookie instead of JWT' }],
      db_changes: [],
      known_limitations: ['Requires shared domains.'],
      next_steps: ['Setup Redis cluster.'],
      tests_passed: true,
      human_reviewed: false,
      commit_sha: 'a1b2c3d4e5f6',
      branch: 'feat/session-auth',
      author: 'BackendAgent',
      build_status: 'reviewing',
      conflict_detected: true,
      conflict_details: [
        {
          type: 'decisions',
          existing_title: 'Authentication: JWT with HTTP-only cookies',
          proposed_title: 'Authentication: Session Cookies'
        }
      ],
      evidence_score: 55
    },
    {
      project_id: projectId,
      agent_id: agent.id,
      content_hash: 'proposal_hash_002',
      summary: 'Added Stripe webhook handler for subscription billing',
      decisions: ['Create Stripe webhook endpoint for handling payment success events.'],
      files_modified: ['app/api/webhooks/stripe/route.ts', 'lib/billing.ts'],
      apis_affected: [{ route: '/api/webhooks/stripe', change: 'new endpoint' }],
      db_changes: [],
      known_limitations: [],
      next_steps: ['Deploy to staging and test with Stripe CLI.'],
      tests_passed: true,
      human_reviewed: true,
      commit_sha: 'e5f6a1b2c3d4',
      branch: 'feat/stripe-billing',
      author: 'PaymentsAgent',
      build_status: 'merged',
      conflict_detected: false,
      evidence_score: 92
    },
    {
      project_id: projectId,
      agent_id: agent.id,
      content_hash: 'proposal_hash_003',
      summary: 'Add direct filesystem write tools to python SDK',
      decisions: ['Export filesystem write tools to agent environment.'],
      files_modified: ['sdk/python/agenthelm/tools.py'],
      apis_affected: [],
      db_changes: [],
      known_limitations: [],
      next_steps: [],
      tests_passed: false,
      human_reviewed: true,
      commit_sha: '7f8g9h0i1j2k',
      branch: 'feat/fs-tools',
      author: 'DevOpsAgent',
      build_status: 'rejected',
      conflict_detected: false,
      rejection_reason: 'Security constraint violation: file write tools are disallowed in non-sandboxed runners.',
      evidence_score: 20
    }
  ]

  for (const proposal of demoProposals) {
    const { data: existingProp } = await supabase
      .from('knowledge_proposals')
      .select('id')
      .eq('project_id', projectId)
      .eq('content_hash', proposal.content_hash)
      .limit(1)
      .single()

    if (!existingProp) {
      const { error: propErr } = await supabase
        .from('knowledge_proposals')
        .insert(proposal)
      if (propErr) throw propErr
    }
  }

  // 7. Create demo tasks (traces)
  const demoTasks = [
    {
      agent_id: agent.id,
      user_id: user.id,
      project_id: projectId,
      task_description: "Research market trends for AI governance",
      status: "completed",
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    },
    {
      agent_id: agent.id,
      user_id: user.id,
      project_id: projectId,
      task_description: "Web scraping production logs for anomalies",
      status: "running",
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 mins ago
    },
    {
      agent_id: agent.id,
      user_id: user.id,
      project_id: projectId,
      task_description: "Analyze security boundaries for Agent-007",
      status: "completed",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
    },
    {
      agent_id: agent.id,
      user_id: user.id,
      project_id: projectId,
      task_description: "Generate weekly safety report",
      status: "failed",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
    }
  ]

  const { error: tasksErr } = await supabase.from('agent_tasks').insert(demoTasks)
  if (tasksErr) throw tasksErr

  // 8. Add some logs for the demo agent
  const demoLogs = [
    {
      agent_id: agent.id,
      type: "log",
      level: "info",
      message: "Booting demo agent...",
      created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString()
    },
    {
      agent_id: agent.id,
      type: "log",
      level: "success",
      message: "Connection established with AgentHelm Mission Control",
      created_at: new Date(Date.now() - 1000 * 60 * 64).toISOString()
    }
  ]
  
  await supabase.from('agent_logs').insert(demoLogs)

  revalidatePath('/dashboard')
  return { success: true }
}
