# agenthelm-sdk

Python SDK for AgentHelm — The Control Plane for AI Agents.

Monitor, dispatch, and control your AI agents from your phone or dashboard.

## Install
pip install agenthelm-sdk

## Features
- **⚡️ One-line Integration**: Add `agenthelm.connect()` and you're live.
- **🛰️ Remote Dispatch**: Trigger functions in your agent via Telegram or Dashboard using `@agent.on_dispatch`.
- **📊 Token Tracking**: Real-time monitoring of LLM costs and usage.
- **🤝 Handshake Protocol**: Secure, JWT-based authentication for high-performance telemetry.
- **📡 Offline Queue**: Never lose a log; the SDK buffers data if the connection drops.
- **🤖 AI Failure Analysis**: Gemini-powered log analysis to explain and fix agent crashes.

## Usage
```python
from agenthelm import Agent

# Connect your agent
agent = Agent(
    key="ahe_live_...",
    name="Lead Researcher",
    version="1.0.0"
)

# Handle remote tasks
@agent.on_dispatch
def handle_research(task):
    agent.progress("Starting research...")
    # Your logic here
    return {"status": "complete", "leads": 5}

# Log events
agent.log("Agent is active", level="info")

# Track LLM costs
agent.track_tokens(used=500, model="gpt-4o", cost_per_1k=0.01)

# Block and listen for commands
agent.listen()
```

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

## Handshake Protocol
AgentHelm uses a high-performance handshake protocol. On startup, the SDK pings the server with your `connect_key` to receive a short-lived **JWT Session Token**. All subsequent telemetry (logs, tokens) uses this token, allowing for stateless, sub-millisecond verification without database overhead.

## Documentation & Dashboard
For full documentation and to get your API key, visit:
[https://agenthelm.online](https://agenthelm.online)
