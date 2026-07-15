# agenthelm-node-sdk (v1.0.1)

Monitor your AI agents from AgentHelm.
Add one line. See everything.

## Install

`npm install agenthelm-node-sdk`

## Features
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

### Standard Methods:
- `dock.log(message, level?, data?)`
- `dock.output(data, label?)`
- `dock.error(message, error?)`
- `dock.warn(message)`
- `dock.success(message)`
- `dock.progress(percent, message)`
- `dock.trackTokens({ used, model, costPer1k? })`
- `dock.checkpoint(stepName, state, options?)`
- `dock.resumeFrom(taskId)`
- `dock.stop()`
- `dock.listen()`

## Documentation
Full docs at [https://agenthelm.online](https://agenthelm.online)
