# AgentHelm — AI Agent Control Plane

Monitor, control and debug your AI agents in real time.
Add one line of code to any Python agent and see everything on one dashboard.

![AgentHelm Dashboard](https://agenthelm.vercel.app/og-image.png)

## ✨ Features

- **Real-time Logs** — Stream logs from agents directly to dashboard
- **Token Tracking** — Track usage and costs across LLM providers
- **Remote Control** — Send commands and chat with agents from dashboard
- **Telegram Alerts** — Get notified instantly when agent crashes
- **Multi-agent** — Monitor unlimited agents from one place

---

## 🚀 Quick Start (Python)

### 1. Install SDK
pip install agenthelm-sdk

### 2. Connect your agent
from agenthelm import Agent

agent = Agent(
    key="ahe_live_...",        # from agenthelm.vercel.app
    name="My Agent",
    agent_type="python"
)

agent.log("Agent started!", level="info")
agent.output({"result": "done", "tokens": 312}, label="summary")
agent.track_tokens(used=312, model="gpt-4", cost_per_1k=0.03)
agent.warn("High memory usage")
agent.error("Something failed")
agent.stop()

### 3. View on dashboard
Go to https://agenthelm.vercel.app/dashboard

---

## 📦 SDK Methods

| Method | Description |
|---|---|
| `agent.log(msg, level)` | Send log — info/warning/error/success |
| `agent.output(data, label)` | Send structured dict output |
| `agent.track_tokens(used, model, cost_per_1k)` | Track token usage + cost |
| `agent.warn(msg)` | Shortcut for warning log |
| `agent.error(msg)` | Shortcut for error log |
| `agent.success(msg)` | Shortcut for success log |
| `agent.stop()` | Mark agent as stopped |

---

## 🛠 Self-host

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account

### Setup
git clone https://github.com/jayasukuv11-beep/agenthelm
cd agenthelm
npm install

### Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=your_telegram_token
NEXT_PUBLIC_APP_URL=https://your-domain.com
ENCRYPTION_KEY=your_32_char_secret

### Deploy
npm run build
# or deploy to Vercel

---

## 📚 Links

- 🌐 Dashboard: https://agenthelm.vercel.app
- 📦 PyPI: https://pypi.org/project/agenthelm-sdk
- 🐛 Issues: https://github.com/jayasukuv11-beep/agenthelm/issues

---

## 📄 License
MIT
