# Day 1 acceptance: Cross-Agent Handoff

This is the end-to-end acceptance test for AgentHelm's shared Project Brain.

## Prerequisites

1. Deploy the current application and database migration set.
2. Create an AgentHelm project for the repository.
3. Configure the AgentHelm MCP server for both Claude Code and Codex with the same values:

~~~json
{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp"],
      "env": {
        "AGENTHELM_BASE_URL": "https://YOUR-VERCEL-DOMAIN",
        "AGENTHELM_CONNECT_KEY": "YOUR_AGENTHELM_CONNECT_KEY",
        "AGENTHELM_PROJECT": "YOUR_PROJECT_ID_OR_NAME"
      }
    }
  }
}
~~~

4. Keep the AgentHelm dashboard open on the selected project. Its Recent Activity feed records proposal writes, Brain publishes, and context read events with local timestamps.

## Phase A — Claude writes knowledge

1. Start a fresh Claude Code session with the repository open and no pasted architecture context.
2. Start screen recording with the AgentHelm dashboard visible beside the terminal.
3. Prompt Claude: **“Analyze this repository's architecture and publish your findings to AgentHelm.”**
4. Claude must call the `propose_knowledge` MCP tool. Capture the proposal ID in its response and the matching dashboard timeline event.
5. If the proposal enters **reviewing**, approve it from the AgentHelm proposal-review flow. This is intentional: unverified architecture claims must not become shared truth automatically.
6. Confirm the proposal reaches **merged** and a new Brain version appears.
7. Stop recording and end the Claude session.

## Phase B — Codex reads knowledge

1. Open a new Codex session for the same repository and MCP configuration.
2. Start a second screen recording with the AgentHelm dashboard visible.
3. Record the timestamp when the Codex session is opened.
4. Prompt Codex: **“Add a new endpoint following our existing patterns.”** Do not re-explain the architecture.
5. Codex must call `get_context` before proposing implementation details.
6. On the dashboard, confirm a **Context read** activity item appears. It includes the reading agent, selected-entry count, and timestamp.
7. Stop the clock when Codex demonstrates the architecture correctly. Record:
   - session-open timestamp;
   - context-read timestamp;
   - correct-understanding timestamp;
   - elapsed wall-clock time.

## Pass criteria

- The Claude proposal is visible and merged into a Brain version.
- Codex makes a `get_context` call without being given the architecture manually.
- The dashboard shows the read event and timestamp.
- Codex uses the published architecture correctly in its endpoint design.
- The recorded elapsed time is retained with the video artifacts.

## Failure triage

- **Proposal rejected/reviewing:** inspect the proposal's validation and review notes, then approve only evidence-backed content.
- **No context returned:** verify project ID, MCP environment variables, and that the proposal is merged rather than merely submitted.
- **No read event in dashboard:** verify `ai_timeline_events` is in the Supabase realtime publication and the dashboard is filtered to the correct project.
