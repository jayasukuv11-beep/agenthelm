/**
 * Cross-tenant isolation test.
 *
 * A core AgentHelm guarantee: a customer's SDK key can only ever touch that
 * customer's own agents, projects, and data. This test proves the SDK gateway
 * rejects any request that presents a valid key but attempts to act on a
 * DIFFERENT tenant's agent_id. This is the security property the whole product
 * is sold on, so it must be proven on every commit — not just asserted in docs.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateConnectKey: vi.fn(),
  authorizeSdkAgent: vi.fn(),
  authorizeSdkTask: vi.fn(),
}))

vi.mock('@/lib/sdk-auth', () => ({
  ...mocks,
  hasError: (result: unknown) =>
    Boolean(result && typeof result === 'object' && 'error' in result),
}))

// Route handlers transitively import server-only modules (telegram → supabase
// admin client). They are irrelevant to gateway authorization behavior, so
// stub them so the suites can run outside the Next.js server runtime.
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: vi.fn(),
  supabaseAdmin: {},
}))
vi.mock('@/lib/telegram', () => ({ sendTelegramToUser: vi.fn() }))

import { POST as postMemory } from '@/app/api/sdk/memory/route'
import { POST as postLog } from '@/app/api/sdk/log/route'
import { POST as postState } from '@/app/api/sdk/state/route'
import { POST as postCheckpoint } from '@/app/api/sdk/checkpoint/route'
import { POST as postInterventions } from '@/app/api/sdk/interventions/route'
import { POST as postExecution } from '@/app/api/sdk/execution/route'
import { POST as postTasksClaim } from '@/app/api/sdk/tasks/claim/route'
import { POST as postTimelineBatch } from '@/app/api/sdk/timeline/batch/route'

// Tenant A — the only identity our key is allowed to represent.
const TENANT_A = '11111111-1111-4111-8111-111111111111'
// Tenant B — an agent this key must NEVER be able to touch. (Valid UUID v4 —
// the gateway validates uuid shape before ownership, so it must parse.)
const OTHER_AGENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function authOk() {
  return {
    userId: TENANT_A,
    plan: 'free',
    supabaseAdmin: {},
    agentId: undefined,
    projectId: undefined,
    keyId: 'key_a',
    scope: undefined,
  }
}

async function req(body: Record<string, unknown>) {
  return new Request('https://agenthelm.test/api/sdk/x', {
    method: 'POST',
    headers: { authorization: 'Bearer ahe_live_tenantA' },
    body: JSON.stringify(body),
  })
}

describe('SDK cross-tenant isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Key is 100% valid for tenant A, but the body claims a foreign agent.
    mocks.validateConnectKey.mockResolvedValue(authOk())
    mocks.authorizeSdkAgent.mockResolvedValue({
      error: 'Agent not found or unauthorized',
      status: 403,
    })
  })

  const routes: [string, (r: Request) => Promise<Response>][] = [
    ['memory', postMemory],
    ['log', postLog],
    ['state', postState],
    ['checkpoint', postCheckpoint],
    ['interventions', postInterventions],
    ['execution', postExecution],
    ['tasks/claim', postTasksClaim],
    ['timeline/batch', postTimelineBatch],
  ]

  // Minimal schema-valid bodies per route (zod validation runs before
  // authorization in the gateway, so bodies must pass their own schema).
  const validBodies: Record<string, Record<string, unknown>> = {
    memory: { agent_id: OTHER_AGENT, index_content: { a: 1 } },
    log: { agent_id: OTHER_AGENT, message: 'x' },
    state: { agent_id: OTHER_AGENT, status: 'running' },
    checkpoint: { agent_id: OTHER_AGENT, task_id: 't1', step_index: 0 },
    interventions: { agent_id: OTHER_AGENT, type: 'pause' },
    execution: {
      agent_id: OTHER_AGENT,
      tool_name: 'deploy',
      classification: 'side_effect',
    },
    'tasks/claim': { agent_id: OTHER_AGENT, title: 'Task' },
    'timeline/batch': {
      agent_id: OTHER_AGENT,
      events: [{ event_type: 'log', title: 'x' }],
    },
  }

  it.each(routes)(
    'rejects %s writes that target another tenant\'s agent',
    async (name, handler) => {
      const res = await handler(
        await req(validBodies[name] ?? { agent_id: OTHER_AGENT })
      )

      // Must be denied. 403 = ownership check enforced.
      // Anything other than 403 (esp. 200 or 404-with-leak) is a regression.
      expect(res.status).toBe(403)
      expect(mocks.authorizeSdkAgent).toHaveBeenCalledWith(
        'ahe_live_tenantA',
        OTHER_AGENT
      )
    }
  )
})
