# agenthelm-sdk

Python SDK for AgentHelm — The Control Plane for AI Agents.

Monitor, dispatch, and control your AI agents from your phone or dashboard.

## Install
pip install agenthelm-sdk

## Features
- **🛡️ Safety Firewall**: Mark tools as `@read`, `@side_effect`, or `@irreversible` (HIL).
- **⚡️ One-line Integration**: Add `agenthelm.connect()` and you're live.
- **🛰️ Remote Dispatch**: Trigger functions in your agent via Telegram or Dashboard.
- **📊 Token Tracking**: Real-time monitoring of LLM costs and usage (INR/USD).
- **🛰️ Integrity Checkpoints**: Save/Resume agent state with SHA256 hashing.
- **🤝 Handshake Protocol**: Secure, JWT-based authentication.

# Usage (Standard)
```python
from agenthelm import Agent

# Connect your agent
agent = Agent(
    key="ahe_live_...",
    name="Lead Researcher",
    version="1.0.0"
)

# Log events
agent.log("Agent is active", level="info")

# Track LLM costs
agent.track_tokens(used=500, model="gpt-4o", cost_per_1k=0.01)
```

## 🛡️ Safety Firewall (Classification-First)
Protect your mission-critical functions by classifying them.

```python
# 1. Read-only (Always safe, no gating)
@agent.read()
def get_weather(city):
    return weather_api.fetch(city)

# 2. Side Effect (Logs and retries, but non-blocking)
@agent.side_effect(max_retries=3)
def send_email(to, subject):
    return mail.send(to, subject)

# 3. Irreversible (BLOCKS until approved by Human via Telegram/Dashboard)
@agent.irreversible(confirm="telegram", timeout=60)
def delete_database_record(record_id):
    return db.delete(record_id)
```

# Handling Dispatch
```python
@agent.on_dispatch
def handle_research(task):
    agent.progress("Starting research...")
    # Your logic here
    return {"status": "complete", "leads": 5}

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
