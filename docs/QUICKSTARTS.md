# AgentHelm Integration Quickstarts

This document provides quickstart integration guides for using AgentHelm with major IDEs, agents, and frameworks.

---

## 1. Cursor IDE Setup (`.cursor/mcp.json`)

Configure AgentHelm as a Model Context Protocol (MCP) server directly in Cursor to provide persistent Project Brain memory.

1. Open or create `.cursor/mcp.json` in your workspace root:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp@latest"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "YOUR_PROJECT_ID_HERE",
        "AGENTHELM_BASE_URL": "https://agenthelm.online"
      }
    }
  }
}
```

2. Restart Cursor MCP services under **Settings > Features > MCP**.
3. Cursor AI can now invoke `get_context`, `propose_knowledge`, and `get_history`.

---

## 2. Windsurf IDE Setup (`.codeium/windsurf/mcp_config.json`)

1. Open your Windsurf MCP configuration file (`~/.codeium/windsurf/mcp_config.json`).
2. Add the `agenthelm` server configuration:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp@latest"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "YOUR_PROJECT_ID_HERE",
        "AGENTHELM_BASE_URL": "https://agenthelm.online"
      }
    }
  }
}
```

---

## 3. Claude Code & Claude Desktop Setup

1. Open your Claude Desktop configuration file:
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the server entry:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp@latest"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "YOUR_PROJECT_ID_HERE",
        "AGENTHELM_BASE_URL": "https://agenthelm.online"
      }
    }
  }
}
```

---

## 4. CrewAI Integration (Python)

```bash
pip install agenthelm-sdk crewai
```

```python
from agenthelm import Agent
from crewai import Agent as CrewAgent, Task, Crew

# 1. Initialize AgentHelm SDK
helm_agent = Agent(
    key="ahe_live_...",
    name="Lead Researcher",
    project="AgentHelm Platform"
)

# 2. Fetch Project Brain Context
context = helm_agent.get_context(category="architecture")
print("Project Brain context entries:", len(context.entries))

# 3. Decorate Irreversible Tools with Safety Firewall
@helm_agent.irreversible(confirm="telegram", timeout=60)
def deploy_production_service(payload: dict):
    # Execution pauses until approved via Telegram or Dashboard
    return {"status": "deployed", "payload": payload}

# 4. Propose new Knowledge back to the Brain Compiler
helm_agent.propose_knowledge(
    summary="Configured microservice routing with API Gateway",
    decisions=["Use NGINX ingress controller with SSL termination"],
    files_modified=["k8s/ingress.yaml", "config/gateway.json"],
    confidence=95
)
```

---

## 5. LangGraph & LangChain Integration (Node.js)

```bash
npm install agenthelm-node-sdk @langchain/core
```

```typescript
import { connect } from 'agenthelm-node-sdk';

const helm = connect({
  key: process.env.AGENTHELM_CONNECT_KEY!,
  name: 'LangGraph Worker',
  project: 'AgentHelm Platform'
});

// Log telemetry and token usage
helm.log('Executing LangGraph agent step...');
helm.trackTokens({ used: 1250, model: 'gpt-4o' });

// Propose knowledge to compiler
await helm.proposeKnowledge({
  summary: 'Refactored state machine graph reducer logic',
  decisions: ['Store graph checkpoints in Redis backend'],
  filesModified: ['src/graph/state.ts']
});
```
