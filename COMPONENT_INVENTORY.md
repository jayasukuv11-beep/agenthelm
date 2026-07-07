# AgentHelm Frontend Component Inventory

**Generated:** 2026-07-04  
**Total Components:** 30 (10 UI primitives + 13 Dashboard + 3 Landing + 4 Other)

---

## ✅ Reusable — Keep As-Is

| Component | Path | Used By | Notes |
|-----------|------|---------|-------|
| `Button` | `components/ui/button.tsx` | Everywhere | Radix + CVA, solid |
| `Card` / `CardContent` / `CardHeader` / `CardTitle` / `CardDescription` / `CardFooter` | `components/ui/card.tsx` | Everywhere | Radix, solid |
| `Input` | `components/ui/input.tsx` | Forms | Radix, solid |
| `Label` | `components/ui/label.tsx` | Forms | Radix, solid |
| `Badge` | `components/ui/badge.tsx` | Status indicators | Radix + CVA, solid |
| `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter` / `DialogTrigger` | `components/ui/dialog.tsx` | Modals | Radix, solid |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | `components/ui/tabs.tsx` | Agent detail, Settings | Radix, solid |
| `Switch` | `components/ui/switch.tsx` | Settings toggles | Radix, solid |
| `Toast` / `useToast` / `Toaster` | `components/ui/use-toast.ts`, `toast.tsx`, `toaster.tsx` | Global notifications | Radix + custom, solid |
| `Progress` | `components/ui/progress.tsx` | Pipeline stages (future) | Radix, solid |
| `UpgradeButton` | `components/dashboard/UpgradeButton.tsx` | Settings, Swarms, Credits | Cashfree integration, keep |
| `ChatInterface` | `components/dashboard/ChatInterface.tsx` | Agent detail (chat tab) | Complex, keep |
| `TraceTimeline` | `components/dashboard/TraceTimeline.tsx` | Agent detail (traces tab) | Recharts, keep |
| `CostBreakdown` | `components/dashboard/CostBreakdown.tsx` | Agent detail, Credits | Recharts, keep |
| `SLAMetrics` | `components/dashboard/SLAMetrics.tsx` | Agent detail (stats tab) | Recharts, keep |
| `GuardrailHealthScore` | `components/dashboard/GuardrailHealthScore.tsx` | Agent detail (stats tab) | Keep |
| `RegressionAlerts` | `components/dashboard/RegressionAlerts.tsx` | Agent detail (evals tab) | Keep |
| `AITimelinePanel` | `components/dashboard/AITimelinePanel.tsx` | Not used? | Check usage |
| `AgentPresenceGrid` | `components/dashboard/AgentPresenceGrid.tsx` | Not used? | Check usage |
| `CashfreeCheckoutButton` | `components/CashfreeCheckoutButton.tsx` | Payments | Keep |
| `LegalPage` | `components/legal/LegalPage.tsx` | Legal pages | Keep |
| `InstagramCarousel` | `components/instagram-carousel.tsx` | Marketing page | Keep |

---

## 🔄 Replace — Refactor for New Architecture

| Component | Path | Current Use | New Use | Changes Needed |
|-----------|------|-------------|---------|----------------|
| `StatsRow` | `components/dashboard/StatsRow.tsx` | Overview (agent metrics) | Overview (Brain Health metrics) | **Replace metrics**: Total Agents → Brain Version, Running → Knowledge Entries, Tokens → Pending Proposals, Cost → Pipeline Success Rate. Keep Card layout. |
| `BrainHealthCards` |
| `AgentCard` | `components/dashboard/AgentCard.tsx` | Agents list, Overview | Agents page (keep), Project detail sidebar | **Keep for Agents page**. Add `ProjectBrainContext` props for future use (brain version, last injection, proposals) |
| `ProjectBrainPanel` | `components/dashboard/ProjectBrainPanel.tsx` | **Orphaned** (not used anywhere) | **Project Brain page** + **Overview cards** | **Refactor to `BrainHealthDashboard`** (page-level) + `BrainHealthCard` (overview widget). Already fetches `/api/projects/[id]/health` ✅ |
| `KnowledgeProposalsPanel` | `components/dashboard/KnowledgeProposalsPanel.tsx` | **Orphaned** (not used anywhere) | **Knowledge page** + **Project Brain page** | **Refactor to `KnowledgeProposalsTable`** (reusable table) + `KnowledgeProposalCard` (detail). Uses mock data → connect to real API |

---

## 🗑 Remove — Deprecated/Unused

| Component | Path | Reason |
|-----------|------|--------|
| `AITimelinePanel` | `components/dashboard/AITimelinePanel.tsx` | Not imported anywhere. Timeline data now in `TraceTimeline` + `ChatInterface` |
| `AgentPresenceGrid` | `components/dashboard/AgentPresenceGrid.tsx` | Not imported anywhere. Swarms page shows handoffs instead |

---

## 🏝 Orphaned — Exist But Not Integrated

| Component | Path | Backend API | Action |
|-----------|------|-------------|--------|
| `ProjectBrainPanel` | `components/dashboard/ProjectBrainPanel.tsx` | `GET /api/projects/[projectId]/health` ✅ | **Integrate in Phase 3** (Project Brain + Knowledge merged phase) |
| `KnowledgeProposalsPanel` | `components/dashboard/KnowledgeProposalsPanel.tsx` | `POST /api/projects/[projectId]/proposals/[id]/resolve` ✅ | **Integrate in Phase 3** (same phase) |

> **Critical Finding:** Two fully-built brain components exist but are completely disconnected from the UI. This is the highest-ROI integration work.

---

## ❓ Missing — Need to Create

| Component | Purpose | Phase | Priority |
|-----------|---------|-------|----------|
| **Landing Page Components** | | | |
| `HeroAnimation` | Agents → Pipeline → Brain → Context animation | 1 | ⭐⭐⭐⭐⭐ |
| `BrainPipelineAnimation` | 7-stage animated pipeline | 1 | ⭐⭐⭐⭐⭐ |
| `ArchitectureDiagram` | Agents → Pipeline → Brain → Dashboard → SDK → Observability | 1 | ⭐⭐⭐⭐ |
| `SecurityFeatures` | Replay, Poisoning, Permissions, Audit | 1 | ⭐⭐⭐⭐ |
| `ObservabilityFeatures` | Metrics, Tracing, Logs, Health | 1 | ⭐⭐⭐⭐ |
| `SDKSection` | Python, Node, REST | 1 | ⭐⭐⭐ |
| `IntegrationsSection` | Claude Code, Cursor, GitHub, OpenAI, CrewAI, LangGraph, Supabase | 1 | ⭐⭐⭐ |
| `DocumentationCTA` | Link to docs | 1 | ⭐⭐⭐ |
| **Dashboard Navigation** | | | |
| `Sidebar` | New project-centric navigation | 2 | ⭐⭐⭐⭐⭐ |
| `ProjectSelector` | Project switcher in sidebar header | 2 | ⭐⭐⭐⭐⭐ |
| `MobileNav` | Updated bottom nav | 2 | ⭐⭐⭐ |
| **Overview Page** | | | |
| `BrainHealthCards` | 7 metric cards (refactor of StatsRow) | 2 | ⭐⭐⭐⭐⭐ |
| `QuickActions` | View Brain, Review Proposals, Check Pipeline | 2 | ⭐⭐⭐ |
| `RecentActivityFeed` | Proposals, publishes, security events | 2 | ⭐⭐⭐ |
| **Project Brain Page** | | | |
| `BrainHealthDashboard` | Page-level version of ProjectBrainPanel | 3 | ⭐⭐⭐⭐⭐ |
| `KnowledgeCategories` | Category cards with coverage badges | 3 | ⭐⭐⭐⭐ |
| `KnowledgeGraph` | D3/Cytoscape visualization | 3 | ⭐⭐⭐ |
| `BrainSearch` | Search across entries | 3 | ⭐⭐⭐ |
| **Knowledge Page** | | | |
| `KnowledgeTable` | Paginated, filterable, sortable entries | 3 | ⭐⭐⭐⭐⭐ |
| `KnowledgeFilters` | Category, Status, Confidence, Date | 3 | ⭐⭐⭐⭐ |
| `KnowledgeEntryDetail` | Drawer with content, evidence, history | 3 | ⭐⭐⭐⭐ |
| `KnowledgeProposalsTable` | Refactor of KnowledgeProposalsPanel | 3 | ⭐⭐⭐⭐⭐ |
| **Pipeline Page** | | | |
| `PipelineVisualization` | 9-stage visual pipeline | 4 | ⭐⭐⭐⭐ |
| `PipelineStage` | Clickable stage with status/duration/errors | 4 | ⭐⭐⭐⭐ |
| `PipelineHistory` | Historical runs list | 4 | ⭐⭐⭐ |
| **Versions Page** | | | |
| `VersionTimeline` | Git-like timeline | 4 | ⭐⭐⭐⭐ |
| `VersionDiff` | Side-by-side diff | 4 | ⭐⭐⭐ |
| `VersionDetails` | Proposals, merged, superseded, metrics | 4 | ⭐⭐⭐ |
| **Security Page** | | | |
| `SecurityDashboard` | Replay attacks, blocked, audit, poisoning | 5 | ⭐⭐⭐⭐ |
| **Observability Page** | | | |
| `ObservabilityDashboard` | Metrics, traces, logs, health (reuse existing) | 5 | ⭐⭐⭐⭐ |
| **Shared** | | | |
| `PageHeader` | Consistent page titles + actions | 2 | ⭐⭐⭐⭐ |
| `EmptyState` | Standardized empty states with CTAs | 2 | ⭐⭐⭐⭐ |
| `LoadingSkeleton` | Per-component skeletons | 2 | ⭐⭐⭐⭐ |
| `ErrorBoundary` | Per-section error boundaries | 6 | ⭐⭐⭐ |

---

## 📄 Pages Inventory

| Page | Route | Current Focus | Target Focus | Phase |
|------|-------|---------------|--------------|-------|
| Landing | `/` | Agent Dashboard | Project Brain Platform | 1 |
| Login | `/login` | Auth | Auth (unchanged) | — |
| Verify OTP | `/verify-otp` | Auth | Auth (unchanged) | — |
| Onboarding | `/onboarding` | User setup | User setup (unchanged) | — |
| Dashboard Overview | `/dashboard` | Agent metrics | **Project Brain Health** | 2 |
| Agents List | `/dashboard/agents` | Agent cards | **Agents as consumers** | 2 |
| Agent Detail | `/dashboard/agents/[id]` | Logs, traces, chat, stats, evals, settings | Same tabs + Brain context | — |
| Swarms | `/dashboard/swarms` | Handoffs (Studio) | **Agent coordination** | — |
| Credits | `/dashboard/credits` | Token usage | **Usage analytics** | — |
| Settings | `/dashboard/settings` | Profile, billing, telegram | **Profile, billing, integrations** | — |
| Guide | `/dashboard/guide` | Documentation | **Documentation** | — |
| **Project Brain** | `/dashboard/brain/[projectId]` | **Does not exist** | Brain health, categories, graph, search | 3 |
| **Knowledge** | `/dashboard/knowledge/[projectId]` | **Does not exist** | Entries table, filters, proposals | 3 |
| **Pipeline** | `/dashboard/pipeline/[projectId]` | **Does not exist** | Visual pipeline stages | 4 |
| **Versions** | `/dashboard/versions/[projectId]` | **Does not exist** | Git-like version history | 4 |
| **Security** | `/dashboard/security/[projectId]` | **Does not exist** | Security events, audit | 5 |
| **Observability** | `/dashboard/observability/[projectId]` | **Does not exist** | Metrics, traces, logs, health | 5 |

---

## 🔌 API Integration Status

| API Endpoint | Exists | Used By Frontend | Notes |
|--------------|--------|------------------|-------|
| `GET /api/projects/[projectId]/health` | ✅ | `ProjectBrainPanel` (orphaned) | Ready for Project Brain page |
| `POST /api/sdk/proposals` | ✅ | SDK only | Backend only |
| `POST /api/projects/[projectId]/proposals/[id]/resolve` | ✅ | `KnowledgeProposalsPanel` (orphaned) | Ready for Knowledge page |
| `POST /api/sdk/inject` | ✅ | SDK only | Context injection |
| `POST /api/sdk/handoffs` / `GET` | ✅ | Swarms page | Working |
| `POST /api/sdk/command` | ✅ | Agent detail | Working |
| `GET /api/projects` | ❌ | — | **Needed** for project selector |
| `GET /api/projects/[projectId]/brain/entries` | ❌ | — | **Needed** for Knowledge page |
| `GET /api/projects/[projectId]/pipeline/stages` | ❌ | — | **Needed** for Pipeline page |
| `GET /api/projects/[projectId]/versions` | ❌ | — | **Needed** for Versions page |
| `GET /api/projects/[projectId]/security/events` | ❌ | — | **Needed** for Security page |
| `GET /api/projects/[projectId]/observability/metrics` | ❌ | — | **Needed** for Observability page |

---

## 🎯 Phase Execution Order (CTO-Approved)

| Phase | Goal | Components to Build | Components to Integrate |
|-------|------|---------------------|-------------------------|
| **1** | Landing Page | 8 new landing components | — |
| **2** | Navigation + Overview | `Sidebar`, `ProjectSelector`, `BrainHealthCards`, `QuickActions`, `RecentActivityFeed`, `PageHeader`, `EmptyState`, `LoadingSkeleton` | — |
| **3** | Project Brain + Knowledge | `BrainHealthDashboard`, `KnowledgeCategories`, `KnowledgeGraph`, `BrainSearch`, `KnowledgeTable`, `KnowledgeFilters`, `KnowledgeEntryDetail`, `KnowledgeProposalsTable` | `ProjectBrainPanel` → `BrainHealthDashboard`, `KnowledgeProposalsPanel` → `KnowledgeProposalsTable` |
| **4** | Pipeline + Versions | `PipelineVisualization`, `PipelineStage`, `PipelineHistory`, `VersionTimeline`, `VersionDiff`, `VersionDetails` | — |
| **5** | Security + Observability | `SecurityDashboard`, `ObservabilityDashboard` | Reuse: `TraceTimeline`, `CostBreakdown`, `SLAMetrics`, `GuardrailHealthScore`, `RegressionAlerts` |
| **6** | Polish + Accessibility | `ErrorBoundary`, animations, transitions, a11y audit | — |

---

## 📋 Immediate Action Items

1. **Delete unused:** `AITimelinePanel.tsx`, `AgentPresenceGrid.tsx`
2. **Phase 1:** Build landing page components (no backend deps)
3. **Phase 2:** Build navigation + overview (needs `GET /api/projects` - coordinate with backend)
4. **Phase 3:** Integrate orphaned brain components (highest ROI - backend APIs exist)

---

*This inventory prevents duplicate UI and ensures every new component has a clear purpose.*