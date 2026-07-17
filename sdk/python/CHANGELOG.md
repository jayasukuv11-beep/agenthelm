# Changelog

All notable changes to the `agenthelm-sdk` (Python) will be documented in this file.

## [1.1.3] - 2026-07-17

### Fixed
- Fixed PyPI package metadata so package description renders properly.

## [1.1.2] - 2026-07-17

### Added
- Documented unique advanced features (Project Brain Context, Knowledge Proposals, Swarm Coordination, and State Claims) in the README.

## [1.1.1] - 2026-07-17

### Fixed
- Fixed `@agent.read()` decorator to support being invoked both with or without parentheses.
- Fixed `build_sdist.py` and `upload_sdist.py` to support correct bundling and version resolution.

## [1.1.0] - 2026-07-07

### Added
- Added `AgentHelm` alias subclass pointing to the `Agent` class to ensure full backward compatibility for legacy codebases.

### Deprecated
- `AgentHelm` class is now officially deprecated and will be removed in v2.0.0. Developers should transition to using the `Agent` class instead.

### Changed
- Internal alignment and stabilization of context injection, proposal publishing, and presence management endpoints.

## [1.0.0] - 2026-06-15

### Added
- Context injection via `/api/sdk/inject`
- Proposal submission via `/api/sdk/proposals`
- Presence-based locking mechanisms

## [0.1.0] - 2026-03-19

### Added
- Agent class with connect key auth
- log(), output(), track_tokens() methods
- warn(), error(), success() shortcuts
- stop() method
- Auto heartbeat ping every 30s
- Command polling from dashboard
- Verbose terminal output mode
