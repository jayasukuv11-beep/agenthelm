# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.0] - 2024-03-19

### Added
- Initial release of the AgentHelm Python SDK (`agenthelm-sdk`).
- `Agent` class for connecting locally running Python agents to the AgentHelm control plane.
- Methods: `log()`, `warn()`, `error()`, `output()`, `track_tokens()`, `reply()`, `stop()`.
- Decorators: `@dock.on_command()`, `@dock.on_chat`.
- Offline queueing for resilient logging when disconnected.
- Automatic daemon-based heartbeat checks and command polling.
