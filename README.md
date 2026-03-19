# AgentHelm — AI Agent Control Plane

> Monitor, control and debug your AI agents in real time.

[![PyPI](https://img.shields.io/pypi/v/agenthelm-sdk)](https://pypi.org/project/agenthelm-sdk)
[![License](https://img.shields.io/github/license/jayasukuv11-beep/agenthelm)](LICENSE)

## Quick Start

pip install agenthelm-sdk

from agenthelm import Agent

agent = Agent(key="ahe_live_...", name="My Agent")
agent.log("Started!", level="info")
agent.output({"result": "done", "tokens": 312}, label="summary")
agent.track_tokens(used=312, model="llama-3.1-8b", cost_per_1k=0.0002)
agent.stop()

## Features
- Real-time log streaming to dashboard
- Token usage and cost tracking (₹)
- Remote control — stop/start/restart from dashboard
- Telegram crash alerts
- Multi-agent support

## Dashboard
Live at: https://agenthelm.vercel.app

## SDK Methods

| Method | Description |
|---|---|
| log(msg, level) | Send log — info/warning/error/success |
| output(data, label) | Send structured dict output |
| track_tokens(used, model, cost_per_1k) | Track token usage + cost |
| warn(msg) | Warning shortcut |
| error(msg) | Error shortcut |
| success(msg) | Success shortcut |
| stop() | Mark agent stopped |

## Self-host

git clone https://github.com/jayasukuv11-beep/agenthelm
cd agenthelm
npm install
cp .env.example .env.local
# fill in your env vars
npm run dev

## Links
- PyPI: https://pypi.org/project/agenthelm-sdk
- Dashboard: https://agenthelm.vercel.app
- Issues: https://github.com/jayasukuv11-beep/agenthelm/issues

## License
MIT
