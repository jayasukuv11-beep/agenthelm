import { connect } from './dist/index.js'

const KEY = process.env.AGENTHELM_KEY || 'ahe_live_your-key'

console.log('Starting AgentHelm Node.js SDK live test...')

const dock = connect({
  key: KEY,
  name: 'Node SDK Test',
  agentType: 'node',
  baseUrl: 'http://localhost:3000/api/sdk',
  verbose: true
})

// Wait for registration
await new Promise(r => setTimeout(r, 1000))

console.log('\nTest 1: Basic logging')
dock.log('Node SDK test started')
dock.log('Info message', 'info')
dock.log('Warning message', 'warning')
dock.log('Success message', 'success')

await new Promise(r => setTimeout(r, 500))

console.log('\nTest 2: Error logging')
try {
  throw new Error('Test error from Node SDK')
} catch (err) {
  dock.error('Test error occurred', err)
}

await new Promise(r => setTimeout(r, 500))

console.log('\nTest 3: Token tracking')
dock.trackTokens({ used: 1500, model: 'gemini-flash' })
dock.trackTokens({
  used: 800,
  model: 'gpt-4',
  costPer1k: 0.03,
  promptTokens: 500,
  completionTokens: 300
})

await new Promise(r => setTimeout(r, 500))

console.log('\nTest 4: Structured output')
dock.output({
  test: true,
  items: 42,
  success: true,
  sdk: 'node'
})

await new Promise(r => setTimeout(r, 500))

console.log('\nTest 5: Command handlers')
dock.onCommand('stop', (payload) => {
  console.log('Stop received:', payload)
  dock.reply('Stop command acknowledged!')
})

dock.onCommand('run_report', async () => {
  console.log('Run report received')
  dock.output({ report: 'generated', items: 5 })
  dock.reply('Report generated!')
})

dock.onChat((message) => {
  console.log('Chat message:', message)
  dock.reply(`Node echo: ${message}`)
})

console.log('\n✅ All tests sent!')
console.log(`Tokens this session: ${dock.tokensSession}`)
console.log('\nCheck dashboard: http://localhost:3000/dashboard')
console.log('Listening for 30 seconds...')
console.log('Send a chat message from the dashboard!')

setTimeout(() => {
  dock.stop()
  console.log('\nTest complete!')
  process.exit(0)
}, 30000)
