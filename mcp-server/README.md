# AgentHelm MCP Server

Exposes the AgentHelm control plane context and proposals features as Model Context Protocol (MCP) tools:
- `get_context`: Fetch ranked brain entries.
- `propose_knowledge`: Submit knowledge proposals.

---

## Configuration

### Environment Variables
Set the following environment variables when running the server:
- `AGENTHELM_CONNECT_KEY`: Your Agent connection key (connect key from your Profile).
- `AGENTHELM_PROJECT`: The project ID or project name.
- `AGENTHELM_BASE_URL` (optional): The control plane URL (defaults to `http://localhost:3000` or use `https://agenthelm.online` for production).

---

## Client Integration Configurations

### 1. Cursor Setup (`.cursor/mcp.json`)
Add the configuration block below to your `.cursor/mcp.json` or configure it directly in Settings > Features > MCP:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "node",
      "args": ["d:/agentdock/mcp-server/dist/index.js"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "YOUR_PROJECT_NAME_OR_ID_HERE",
        "AGENTHELM_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```

### 2. Claude Desktop Setup
Open your Claude Desktop configuration file (accessible via Settings > Developer > Edit Config):
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the server:

```json
{
  "mcpServers": {
    "agenthelm": {
      "command": "node",
      "args": ["d:/agentdock/mcp-server/dist/index.js"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY_HERE",
        "AGENTHELM_PROJECT": "YOUR_PROJECT_NAME_OR_ID_HERE",
        "AGENTHELM_BASE_URL": "http://localhost:3000"
      }
    }
  }
}
```
