# agenthelm-sdk

Monitor your AI agents from AgentHelm.
Add one line. See everything.

## Install

npm install agenthelm-sdk

## Quick Start (CommonJS)

const { connect } = require('agenthelm-sdk')

const dock = connect({
  key: 'ahe_live_xxxxx',
  name: 'My Agent'
})

dock.log('Agent started')
dock.trackTokens({ used: 1500, model: 'gemini-flash' })
dock.output({ leads: 12, hot: 5 })

dock.onCommand('stop', (payload) => {
  dock.log('Stopping...')
  dock.stop()
})

dock.onChat((message) => {
  dock.reply('Got: ' + message)
})

dock.listen()

## Quick Start (ESM / TypeScript)

import { connect } from 'agenthelm-sdk'

const dock = connect({
  key: 'ahe_live_xxxxx',
  name: 'My Bot',
  agentType: 'node',
  version: '1.0.0'
})

dock.log('Bot started', 'info')

try {
  const result = await doWork()
  dock.output(result)
  dock.trackTokens({ used: 800, model: 'gpt-4', costPer1k: 0.03 })
} catch (err) {
  dock.error('Work failed', err as Error)
}

dock.onCommand('restart', async () => {
  dock.log('Restarting...')
  await restart()
  dock.log('Restarted ✅', 'success')
})

dock.onChat(async (message) => {
  const reply = await processMessage(message)
  dock.reply(reply)
})

await dock.listen()

## API

connect(options) → AgentHelm instance

Options:
  key           string  required   Your connect key
  name          string  optional   Agent display name
  agentType     string  optional   python/node/other
  version       string  optional   Your agent version
  verbose       bool    optional   Log to console (default: true)
  autoPing      bool    optional   Auto heartbeat (default: true)
  pingInterval  number  optional   MS between pings (default: 30000)
  timeout       number  optional   Request timeout MS (default: 5000)

Methods:
  dock.log(message, level?, data?)
  dock.output(data, label?)
  dock.error(message, error?)
  dock.trackTokens({ used, model, costPer1k? })
  dock.reply(message)
  dock.onCommand(type, handler)
  dock.onChat(handler)
  dock.stop()
  dock.listen() → Promise<void>

Properties:
  dock.agentId        string | null
  dock.isConnected    boolean
  dock.name           string
  dock.tokensToday    number
  dock.tokensSession  number
