# agenthelm-sdk (v0.5.0)

Monitor your AI agents from AgentHelm.
Add one line. See everything.

## Install

`npm install agenthelm-node-sdk`

## Features
- **🛡️ Safety Firewall**: Classify actions as `read`, `sideEffect`, or `irreversible` (Human-in-the-Loop).
- **⚡️ One-line Integration**: Import `AgentHelm` and you're live.
- **📊 Token Tracking**: Real-time monitoring of LLM costs (INR/USD).
- **🛰️ Integrity Checkpoints**: Save/Resume agent state with built-in resumability.
- **🤝 Handshake Protocol**: Secure, JWT-based authentication.

## Usage (Standard)

```typescript
import { connect } from 'agenthelm-node-sdk'

const dock = connect({
  key: 'ahe_live_xxxxx',
  name: 'My Agent'
})

dock.log('Agent started')
dock.trackTokens({ used: 1500, model: 'gemini-flash' })
```

## 🛡️ Safety Firewall (Classification-First)
Ensure mission-critical tasks are approved by a human before they execute.

```typescript
// 1. Read-only (Always safe, no gating)
const data = await agent.read(() => fetch_db_record(id));

// 2. Side Effect (Logs and retries, but non-blocking)
await agent.sideEffect(() => send_notification(user), { maxRetries: 5 });

// 3. Irreversible (BLOCKS until approved via Telegram or Dashboard)
await agent.irreversible(async () => {
  return await stripe.charges.create({ ... });
}, { timeout: 60000 });
```

## API

`connect(options)` → `AgentHelm` instance

### Options:
| Option | Type | Description |
|---|---|---|
| `key` | `string` | Your connect key (required) |
| `name` | `string` | Agent display name |
| `agentType` | `string` | `python` | `node` | `other` |
| `version` | `string` | Your agent version |
| `burnRateThreshold`| `number` | Alert if tokens/min exceeds this |

### Safety Methods:
- `dock.read(task)`
- `dock.sideEffect(task, options?)`
- `dock.irreversible(task, options?)`

### Standard Methods:
- `dock.log(message, level?, data?)`
- `dock.output(data, label?)`
- `dock.error(message, error?)`
- `dock.trackTokens({ used, model, costPer1k? })`
- `dock.checkpoint(stepName, state, options?)`
- `dock.resumeFrom(taskId)`
- `dock.stop()`
- `dock.listen()`

## Documentation
Full docs at [https://agenthelm.online](https://agenthelm.online)
