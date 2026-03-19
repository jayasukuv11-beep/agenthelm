# agenthelm-sdk

Python SDK for AgentHelm — AI Agent Control Plane.

## Install
pip install agenthelm-sdk

## Usage
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
agent.warn("High memory!")
agent.error("Something failed")
agent.stop()

## All Methods
| Method | Args | Description |
|---|---|---|
| log(msg, level) | level: info/warning/error/success | Send log |
| output(data, label) | data: dict | Send structured output |
| track_tokens(used, model, cost_per_1k) | used: int | Track usage + cost |
| warn(msg) | msg: str | Warning shortcut |
| error(msg) | msg: str | Error shortcut |
| success(msg) | msg: str | Success shortcut |
| stop() | — | Mark agent stopped |

## Dashboard
https://agenthelm.vercel.app
