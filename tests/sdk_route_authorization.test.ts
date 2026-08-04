import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authorizeSdkAgent: vi.fn(),
  authorizeSdkTask: vi.fn(),
}))

vi.mock('@/lib/sdk-auth', () => ({
  ...mocks,
  hasError: (result: unknown) =>
    Boolean(result && typeof result === 'object' && 'error' in result),
}))

import { POST as createHandoff } from '@/app/api/sdk/handoffs/route'
import { POST as createReasoning } from '@/app/api/sdk/reasoning/route'
import { PATCH as acknowledgeCommand } from '@/app/api/sdk/command/route'

const forbidden = { error: 'Agent not found or unauthorized', status: 403 }

describe('SDK route authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.authorizeSdkAgent.mockResolvedValue(forbidden)
  })

  it('rejects handoff writes before any elevated database access', async () => {
    const response = await createHandoff(new Request('https://agenthelm.test/api/sdk/handoffs', {
      method: 'POST',
      body: JSON.stringify({
        key: 'ahe_live_test',
        agent_id: 'other-tenant-agent',
        to_agent_id: 'target-agent',
      }),
    }))

    expect(response.status).toBe(403)
    expect(mocks.authorizeSdkAgent).toHaveBeenCalledWith('ahe_live_test', 'other-tenant-agent')
  })

  it('rejects reasoning writes before accepting a task or step', async () => {
    const response = await createReasoning(new Request('https://agenthelm.test/api/sdk/reasoning', {
      method: 'POST',
      body: JSON.stringify({
        key: 'ahe_live_test',
        agent_id: 'other-tenant-agent',
        task_id: 'other-tenant-task',
        step_index: 0,
      }),
    }))

    expect(response.status).toBe(403)
    expect(mocks.authorizeSdkAgent).toHaveBeenCalledWith('ahe_live_test', 'other-tenant-agent')
    expect(mocks.authorizeSdkTask).not.toHaveBeenCalled()
  })

  it('rejects command acknowledgement unless the caller owns its agent', async () => {
    const response = await acknowledgeCommand(new Request('https://agenthelm.test/api/sdk/command', {
      method: 'PATCH',
      body: JSON.stringify({
        key: 'ahe_live_test',
        agent_id: 'other-tenant-agent',
        command_id: 'other-tenant-command',
        status: 'delivered',
      }),
    }))

    expect(response.status).toBe(403)
    expect(mocks.authorizeSdkAgent).toHaveBeenCalledWith('ahe_live_test', 'other-tenant-agent')
  })
})
