# AgentHelm MCP Server

Exposes the AgentHelm control plane context and proposals features as Model Context Protocol (MCP) tools:
- `get_context`: Fetch versioned architecture guidelines, database schemas, and conventions.
- `propose_knowledge`: Submit new engineering decisions and codebase discoveries to the Brain Compiler.
- `get_history`: Query history logs, diffs, and decision trace blame.

---

## Configuration

### Environment Variables
Set the following environment variables when running the server:
- `AGENTHELM_CONNECT_KEY`: Your Agent connection key from [agenthelm.online](https://agenthelm.online).
- `AGENTHELM_PROJECT`: The project ID or project name.
- `AGENTHELM_BASE_URL` (optional): Defaults to `https://agenthelm.online`.

---

## Client Integration Configurations

### 1. Cursor Setup (`.cursor/mcp.json`)
Add the configuration block below to your `.cursor/mcp.json` or configure it directly in Settings > Features > MCP:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "your-project-name"
      }
    }
  }
}
```

### 2. Claude Desktop Setup
Open your Claude Desktop configuration file:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the server:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "your-project-name"
      }
    }
  }
}
```
