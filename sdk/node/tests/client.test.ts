import { AgentHelm, connect } from '../src/index'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

function mockSuccess(data: object = {}) {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ agent_id: 'test-uuid-1234', ...data }),
  })
}

beforeEach(() => {
  mockFetch.mockClear()
  mockSuccess()
})

describe('AgentHelm constructor', () => {
  test('throws on invalid key', () => {
    expect(() => new AgentHelm({ key: 'invalid' })).toThrow()
  })

  test('accepts valid key', () => {
    const dock = new AgentHelm({
      key: 'ahe_live_test123',
      autoPing: false,
    })
    expect(dock.name).toBe('Node Agent')
    dock.stop()
  })

  test('connect() factory works', () => {
    const dock = connect({
      key: 'ahe_live_test123',
      name: 'Test Bot',
      autoPing: false,
    })
    expect(dock.name).toBe('Test Bot')
    dock.stop()
  })
})

describe('logging methods', () => {
  let dock: AgentHelm

  beforeEach(() => {
    dock = new AgentHelm({
      key: 'ahe_live_test123',
      autoPing: false,
    })
  })

  afterEach(() => dock.stop())

  test('log() sends request', async () => {
    dock.log('test message')
    await new Promise(r => setTimeout(r, 50))
    expect(mockFetch).toHaveBeenCalled()
  })

  test('error() sends with error level', async () => {
    dock.error('Something failed')
    await new Promise(r => setTimeout(r, 50))
    const calls = mockFetch.mock.calls
    const body = JSON.parse(calls[calls.length - 1][1].body)
    expect(body.level).toBe('error')
  })

  test('trackTokens() accumulates count', async () => {
    dock.trackTokens({ used: 500, model: 'test' })
    dock.trackTokens({ used: 300, model: 'test' })
    expect(dock.tokensSession).toBe(800)
  })

  test('output() sends success level', async () => {
    dock.output({ result: 'done' })
    await new Promise(r => setTimeout(r, 50))
    const calls = mockFetch.mock.calls
    const body = JSON.parse(calls[calls.length - 1][1].body)
    expect(body.level).toBe('success')
  })
})

describe('command handlers', () => {
  test('onCommand registers handler', () => {
    const dock = new AgentHelm({
      key: 'ahe_live_test123',
      autoPing: false,
    })

    const handler = jest.fn()
    dock.onCommand('stop', handler)
    dock.stop()
  })

  test('onChat registers handler', () => {
    const dock = new AgentHelm({
      key: 'ahe_live_test123',
      autoPing: false,
    })

    const handler = jest.fn()
    dock.onChat(handler)
    dock.stop()
  })
})
