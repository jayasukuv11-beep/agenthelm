<div align="center">
  <img src="https://agenthelm.online/logo.png" width="120" alt="AgentHelm Logo" />
  <h1>AgentHelm</h1>
  <p><strong>The Industrial Control Plane for AI Autonomous Agents</strong></p>

  <p>
    <a href="https://pypi.org/project/agenthelm-sdk"><img src="https://img.shields.io/pypi/v/agenthelm-sdk?color=orange&style=flat-square" alt="PyPI" /></a>
    <a href="https://www.npmjs.com/package/agenthelm-node-sdk"><img src="https://img.shields.io/npm/v/agenthelm-node-sdk?color=orange&style=flat-square" alt="npm" /></a>
    <a href="https://github.com/jayasukuv11-beep/agenthelm/blob/main/LICENSE"><img src="https://img.shields.io/github/license/jayasukuv11-beep/agenthelm?style=flat-square" alt="License" /></a>
    <a href="https://agenthelm.online"><img src="https://img.shields.io/badge/status-production-success?style=flat-square" alt="Status" /></a>
  </p>
</div>

---

## 🏗️ Governance vs. Orchestration

Most tools focus on how agents *think* (LangChain, CrewAI). **AgentHelm** focuses on how agents *behave*. 

It is a lightweight governance layer that wraps your existing agents, providing a secure bridge between autonomous execution and human oversight.

### Key Pillars
- **🔭 Absolute Observability**: Real-time log streaming, token tracing, and state inspection.
- **🛡️ Human-in-the-Loop (HITL)**: One-click Telegram approvals for irreversible actions (deletes, payments, transfers).
- **📉 Cost Safeguards**: Hard limits on token spend per task and automated injection detection.
- **⏸️ Remote Control**: Pause, stop, or override agent state from the dashboard or your phone.

---

## 🚀 Quick Start (v1.0.0)

### Python
```bash
pip install agenthelm-sdk
```
```python
from agenthelm import Agent

# Connect to the control plane
agent = Agent(key="ahe_live_...", name="Market Researcher")

@agent.irreversible(confirm="telegram")
def execute_trade(symbol, amount):
    # This won't run until you click 'Approve' on your phone
    return broker.trade(symbol, amount)

agent.log("Scanning market trends...", level="info")
```

### Node.js
```bash
npm install agenthelm-node-sdk
```
```javascript
import { Agent } from 'agenthelm-node-sdk';

const agent = new Agent({ key: 'ahe_live_...', name: 'Support Bot' });

agent.log('Analyzing sentiment...', 'info');
agent.output({ score: 0.92 }, 'sentiment_results');
```

---

## 📲 The Safety Bridge (Telegram)

AgentHelm bridges the gap between your server and your pocket. When an agent hits a method decorated with `@irreversible`, you receive a rich alert on Telegram:

> **⚠️ Irreversible Action Requested**
> **Agent:** `Cloud Architect`
> **Action:** `destroy_infrastructure`
> **Payload:** `{"region": "us-east-1"}`
>
> [ ✅ Approve ]   [ ❌ Reject ]

---

## 📊 Dashboard

The **Industrial Signal Orange** dashboard provides a high-fidelity view of your entire agent fleet. Surface anomalies, track multi-currency billing, and audit every single tool execution.

Visit **[agenthelm.online](https://agenthelm.online)** to get started.

---

## 🛠️ Tech Stack
- **Dashboard**: Next.js, TailwindCSS (Industrial Theme), Supabase, Shadcn/UI.
- **SDKs**: Python (twine), Node.js (TypeScript).
- **Control**: Telegram Bot API, Edge Functions.

## ⚖️ License
MIT © [AgentHelm Team](https://agenthelm.online)
