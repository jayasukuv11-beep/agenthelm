# agenthelm-sdk

Python SDK for AgentHelm — AI Agent Control Plane.

## Install
pip install agenthelm-sdk

## Quick Start
from agenthelm import Agent

agent = Agent(
    key="ahe_live_...",
    name="My Agent",
    agent_type="python",
    version="1.0.0"
)

agent.log("Started!", level="info")
agent.output({"result": "done"}, label="summary")
agent.track_tokens(used=500, model="llama-3.1-8b", cost_per_1k=0.0002)
agent.stop()

## Methods
| Method | Args | Description |
|---|---|---|
| `log(msg, level)` | level: info/warning/error/success | Send log to dashboard |
| `output(data, label)` | data: dict, label: str | Send structured output |
| `track_tokens(used, model, cost_per_1k)` | used: int, model: str | Track token usage |
| `warn(msg)` | msg: str | Warning log shortcut |
| `error(msg)` | msg: str | Error log shortcut |
| `success(msg)` | msg: str | Success log shortcut |
| `stop()` | — | Mark agent stopped |

## Links
- Dashboard: https://agenthelm.vercel.app
- Docs: https://github.com/jayasukuv11-beep/agenthelm
