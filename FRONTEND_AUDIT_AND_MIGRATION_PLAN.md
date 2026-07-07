# AgentHelm Frontend Audit & Migration Plan (CTO-Approved)

**Current Identity:** "Mission Control for Autonomous Agents" (Agent Dashboard)
**Target Identity:** "The Project Brain for AI Engineering" (AI Engineering Infrastructure Platform)

---

## Executive Summary

The current frontend is built around **agent monitoring** (agents, swarms, traces, credits). The backend has evolved into a **Project Brain platform** with knowledge proposals, brain compiler, brain pipeline, brain publisher, brain versions, security pipeline, context injection, knowledge analysis, merge planning, observability, and production SDK.

**Critical Finding:** Two fully-built brain components exist (`ProjectBrainPanel`, `KnowledgeProposalsPanel`) but are completely orphaned - not integrated into any page!

---

## CTO-Approved Phase Order (6 Phases)

| Phase | Goal | Priority | Dependencies |
|-------|------|----------|--------------|
| **1** | Landing Page | ⭐⭐⭐⭐⭐ | None (no backend deps) |
| **2** | Dashboard Navigation + Overview | ⭐⭐⭐⭐⭐ | `GET /api/projects` (backend) |
| **3** | Project Brain + Knowledge | ⭐⭐⭐⭐⭐ | **Orphaned components + existing APIs** |
| **4** | Pipeline + Versions | ⭐⭐⭐⭐ | New backend APIs needed |
| **5** | Security + Observability | ⭐⭐⭐⭐ | New backend APIs needed |
| **6** | Polish + Accessibility | ⭐⭐⭐ | None |

**Key Change:** Merged Project Brain + Knowledge into Phase 3 (highest ROI - components exist, APIs exist). Merged Pipeline + Versions into Phase 4. Merged Security + Observability into Phase 5.

---

## Phase 1: Landing Page Redesign (Week 1) — **START HERE**

**Goal:** Transform landing page from "Agent Dashboard" to "Project Brain for AI Engineering"

### New Landing Page Structure

```
1. Hero Section
   Headline: "One Project. One Brain. Unlimited AI Agents."
   Subheadline: "AgentHelm gives every AI coding agent a shared Project Brain so they remember architecture, APIs, decisions, and project knowledge instead of starting from scratch."
   Primary CTA: "Get Started Free" → /login
   Secondary CTA: "Read Documentation" → /docs
   GitHub link
   
   Hero Animation: [Claude Code, Cursor, Codex, OpenAI SDK, CrewAI] 
     ↓ Brain Pipeline 
     ↓ Project Brain 
     ↓ Shared Context

2. Problem Section
   "Agents forget context" | "Duplicate work" | "Contradict each other" | "Lose architecture"

3. Solution Section
   "Knowledge belongs to the Project, Not the Agent"

4. Brain Pipeline (Animated)
   Proposal → Validation → Verification → Knowledge Analysis → Merge Planning → Publishing → Project Brain

5. Architecture Diagram
   Agents → Brain Pipeline → Project Brain → Dashboard → SDK → Observability

6. Security Features
   Replay Protection | Context Poisoning | Permission Validation | Audit Logs

7. Observability Features
   Metrics | Tracing | Logs | Health

8. SDK Section
   Python | Node | REST

9. Integrations
   Claude Code | Cursor | GitHub | OpenAI | CrewAI | LangGraph | Supabase

10. Pricing (update copy only)

11. Documentation CTA
```

### Files to Create/Modify

**New Components (Landing):**
- `components/landing/HeroAnimation.tsx` - Agent logos flowing into brain
- `components/landing/BrainPipelineAnimation.tsx` - 7-stage animated pipeline
- `components/landing/ArchitectureDiagram.tsx` - System architecture
- `components/landing/SecurityFeatures.tsx` - 4 security cards
- `components/landing/ObservabilityFeatures.tsx` - 4 observability cards
- `components/landing/SDKSection.tsx` - 3 SDK cards
- `components/landing/IntegrationsSection.tsx` - 7 integration logos
- `components/landing/DocumentationCTA.tsx` - Final CTA section

**Modify:**
- `app/page.tsx` - Update metadata (title, description, OpenGraph)
- `app/page-client.tsx` - **Complete rewrite** using new components
- `app/globals.css` - Add keyframe animations for hero/pipeline

### Verification Checklist
- [ ] `npm run build` passes
- [ ] `npm run lint` passes  
- [ ] Landing page loads at `/`
- [ ] Hero animation plays (agents → pipeline → brain → context)
- [ ] All 11 sections render
- [ ] CTAs link correctly (/login, /docs, GitHub)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark theme consistent
- [ ] No console errors
- [ ] Existing functionality (login, onboarding) unaffected

---

## Phase 2: Dashboard Navigation + Overview (Week 2)

**Goal:** Replace agent-centric sidebar with project-centric navigation; transform Overview from agent metrics to Brain Health

### New Sidebar Structure
```
[Project Selector Dropdown]
├── Overview
├── Projects
├── Project Brain
├── Knowledge
├── Pipeline
├── Versions
├── Agents
├── Security
├── Observability
├── SDK
└── Settings
```

### New Overview Metrics (BrainHealthCards)
| Old Metric | New Metric | API Source |
|------------|------------|------------|
| Total Agents | Brain Version | `/api/projects/[id]/health` |
| Running Now | Knowledge Entries | `/api/projects/[id]/health` |
| Tokens Today | Pending Proposals | `/api/projects/[id]/health` |
| Est. Cost | Context Coverage | `/api/projects/[id]/health` |
| — | Pipeline Success Rate | `/api/projects/[id]/health` |
| — | Security Score | `/api/projects/[id]/health` |
| — | Latest Publish | `/api/projects/[id]/health` |

### Files to Create/Modify

**New Components:**
- `components/dashboard/Sidebar.tsx` - New navigation
- `components/dashboard/ProjectSelector.tsx` - Project dropdown
- `components/dashboard/BrainHealthCards.tsx` - 7 metric cards (refactor StatsRow)
- `components/dashboard/QuickActions.tsx` - View Brain, Review Proposals, Check Pipeline
- `components/dashboard/RecentActivityFeed.tsx` - Proposals, publishes, security events
- `components/dashboard/PageHeader.tsx` - Consistent page header
- `components/dashboard/EmptyState.tsx` - Standardized empty states
- `components/dashboard/LoadingSkeleton.tsx` - Per-component skeletons

**Modify:**
- `app/(dashboard)/layout.tsx` - Use new Sidebar
- `app/(dashboard)/dashboard/page.tsx` - Complete rewrite for Brain Health overview
- `components/dashboard/StatsRow.tsx` - **Deprecate** (replace with BrainHealthCards)

**Backend Needed:**
- `GET /api/projects` - List user's projects (for selector)

### Verification Checklist
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Sidebar shows new navigation
- [ ] Project selector works
- [ ] Overview shows 7 Brain Health cards with real data
- [ ] Quick actions navigate to correct pages
- [ ] Recent activity feed shows data
- [ ] Mobile bottom nav updated
- [ ] All existing routes still accessible
- [ ] Demo mode still works
- [ ] Agent pages unchanged

---

## Phase 3: Project Brain + Knowledge (Week 3) — **HIGHEST ROI**

**Goal:** Integrate the two orphaned brain components + build Knowledge page

> **Why merged:** Both components exist. Both backend APIs exist. This is the core product.

### Project Brain Page (`/dashboard/brain/[projectId]`)
- **BrainHealthDashboard** (refactor of ProjectBrainPanel) - Page level
- **KnowledgeCategories** - Architecture, Decisions, Database, APIs with coverage badges
- **KnowledgeGraph** - Visual graph (D3 or Cytoscape.js)
- **BrainSearch** - Search across entries

### Knowledge Page (`/dashboard/knowledge/[projectId]`)
- **KnowledgeTable** - Paginated, filterable, sortable entries
- **KnowledgeFilters** - Category, Status, Confidence range, Date range
- **KnowledgeEntryDetail** - Drawer with content, evidence, history
- **KnowledgeProposalsTable** (refactor of KnowledgeProposalsPanel) - Proposals with approve/reject

### Files to Create/Modify

**Refactor (Orphaned → Integrated):**
- `components/dashboard/BrainHealthDashboard.tsx` ← `ProjectBrainPanel.tsx`
- `components/dashboard/KnowledgeProposalsTable.tsx` ← `KnowledgeProposalsPanel.tsx`

**New Components:**
- `components/dashboard/KnowledgeCategories.tsx`
- `components/dashboard/KnowledgeGraph.tsx`
- `components/dashboard/BrainSearch.tsx`
- `components/dashboard/KnowledgeTable.tsx`
- `components/dashboard/KnowledgeFilters.tsx`
- `components/dashboard/KnowledgeEntryDetail.tsx`

**New Pages:**
- `app/(dashboard)/dashboard/brain/[projectId]/page.tsx`
- `app/(dashboard)/dashboard/knowledge/[projectId]/page.tsx`

**Backend APIs (Already Exist!):**
- `GET /api/projects/[projectId]/health` ✅
- `POST /api/projects/[projectId]/proposals/[id]/resolve` ✅

**Backend APIs Needed:**
- `GET /api/projects/[projectId]/brain/entries` - Paginated entries with filters

### Verification Checklist
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Project Brain page loads with real health data
- [ ] Knowledge categories show coverage badges
- [ ] Knowledge graph renders
- [ ] Search works across entries
- [ ] Knowledge table loads paginated data
- [ ] Filters work (category, status, confidence, date)
- [ ] Entry detail drawer shows content + evidence
- [ ] Proposals table shows real data (not mock)
- [ ] Approve/Reject works
- [ ] Navigation from Overview → Brain → Knowledge works

---

## Phase 4: Pipeline + Versions (Week 4)

**Goal:** Visualize brain pipeline stages and git-like version history

### Pipeline Page (`/dashboard/pipeline/[projectId]`)
- **PipelineVisualization** - 9 stages: Proposal → Sanitize → Permission Validation → Replay Protection → Verification → Analysis → Merge Planning → Publishing → Project Brain
- **PipelineStage** - Clickable, shows status/duration/errors/retry count
- **PipelineHistory** - Historical runs list

### Versions Page (`/dashboard/versions/[projectId]`)
- **VersionTimeline** - Brain v1 → v2 → v3 → Current
- **VersionDiff** - Side-by-side diff between versions
- **VersionDetails** - Proposals merged, entries added/deprecated, metrics

### Files to Create

**New Components:**
- `components/dashboard/PipelineVisualization.tsx`
- `components/dashboard/PipelineStage.tsx`
- `components/dashboard/PipelineHistory.tsx`
- `components/dashboard/VersionTimeline.tsx`
- `components/dashboard/VersionDiff.tsx`
- `components/dashboard/VersionDetails.tsx`

**New Pages:**
- `app/(dashboard)/dashboard/pipeline/[projectId]/page.tsx`
- `app/(dashboard)/dashboard/versions/[projectId]/page.tsx`

**Backend APIs Needed:**
- `GET /api/projects/[projectId]/pipeline/stages`
- `GET /api/projects/[projectId]/pipeline/history`
- `GET /api/projects/[projectId]/versions`
- `GET /api/projects/[projectId]/versions/[version]/diff`

### Verification Checklist
- [ ] `npm run build` passes
- [ ] Pipeline shows all 9 stages with real status
- [ ] Stage details expand on click
- [ ] Historical runs list works
- [ ] Version timeline renders
- [ ] Diff view works between versions
- [ ] Version metrics shown

---

## Phase 5: Security + Observability (Week 5)

**Goal:** Complete the platform picture with security audit and observability

### Security Page (`/dashboard/security/[projectId]`)
- **SecurityDashboard** - Replay attacks blocked, blocked proposals, audit events, permission failures, context poisoning detections, rate limiting

### Observability Page (`/dashboard/observability/[projectId]`)
- **ObservabilityDashboard** - Reuse existing: `TraceTimeline`, `CostBreakdown`, `SLAMetrics`, `GuardrailHealthScore`, `RegressionAlerts` + new metrics/logs/health

### Files to Create

**New Components:**
- `components/dashboard/SecurityDashboard.tsx`
- `components/dashboard/ObservabilityDashboard.tsx`

**New Pages:**
- `app/(dashboard)/dashboard/security/[projectId]/page.tsx`
- `app/(dashboard)/dashboard/observability/[projectId]/page.tsx`

**Backend APIs Needed:**
- `GET /api/projects/[projectId]/security/events`
- `GET /api/projects/[projectId]/observability/metrics`

### Verification Checklist
- [ ] `npm run build` passes
- [ ] Security page shows audit events
- [ ] Observability page reuses existing components correctly
- [ ] No regressions in agent detail pages
- [ ] Data loads from real APIs

---

## Phase 6: Polish + Accessibility (Week 6)

**Goal:** Cohesive experience, performance, accessibility, animations

### Tasks
- Framer Motion page transitions
- Staggered animations on lists
- Keyboard navigation throughout
- ARIA labels, focus management
- Dark theme refinement (Linear/Vercel consistency)
- Responsive breakpoints tested
- Bundle size optimization (lazy load heavy pages)
- Update all meta tags, OpenGraph per page
- Error boundaries per section (`ErrorBoundary` component)
- Lighthouse audit > 90
- Bundle analysis < 500KB gzipped
- Full test suite passes

### Files to Modify
- All page components
- `app/globals.css` - Animations, scrollbars, focus styles
- `next.config.mjs` - Bundle analysis
- `components/ui/*` - Accessibility improvements
- `components/dashboard/ErrorBoundary.tsx` (new)

### Verification Checklist
- [ ] `npm run build` passes
- [ ] `npm run lint` passes (zero errors)
- [ ] `npm run test` passes
- [ ] TypeScript strict mode - no `any`
- [ ] Lighthouse > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Bundle < 500KB gzipped
- [ ] No console errors
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader friendly
- [ ] Page transitions smooth
- [ ] Loading states consistent
- [ ] Empty states helpful with CTAs

---

## Component Reuse Summary

| Category | Count | Action |
|----------|-------|--------|
| UI Primitives | 11 | Keep as-is |
| Dashboard (reusable) | 7 | Keep as-is |
| Dashboard (refactor) | 2 | `ProjectBrainPanel` → `BrainHealthDashboard`, `KnowledgeProposalsPanel` → `KnowledgeProposalsTable` |
| Dashboard (replace) | 1 | `StatsRow` → `BrainHealthCards` |
| Dashboard (remove) | 2 | `AITimelinePanel`, `AgentPresenceGrid` |
| Landing (new) | 8 | Build from scratch |
| Dashboard (new pages) | 25 | Build per phase |
| Shared (new) | 4 | `PageHeader`, `EmptyState`, `LoadingSkeleton`, `ErrorBoundary` |

---

## Backend API Coordination Required

| Phase | API Needed | Status |
|-------|------------|--------|
| 2 | `GET /api/projects` | **Backend must build** |
| 3 | `GET /api/projects/[projectId]/brain/entries` | **Backend must build** |
| 4 | `GET /api/projects/[projectId]/pipeline/stages` | **Backend must build** |
| 4 | `GET /api/projects/[projectId]/pipeline/history` | **Backend must build** |
| 4 | `GET /api/projects/[projectId]/versions` | **Backend must build** |
| 4 | `GET /api/projects/[projectId]/versions/[version]/diff` | **Backend must build** |
| 5 | `GET /api/projects/[projectId]/security/events` | **Backend must build** |
| 5 | `GET /api/projects/[projectId]/observability/metrics` | **Backend must build** |

**Already Exist (Phase 3 can start immediately):**
- `GET /api/projects/[projectId]/health` ✅
- `POST /api/projects/[projectId]/proposals/[id]/resolve` ✅

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Backend APIs delayed | Build with mock data, swap when ready |
| Breaking agent monitoring | Preserve `/dashboard/agents/*` routes entirely |
| Scope creep | Strict phase gates - no new features mid-phase |
| Performance regression | Bundle analysis each phase |
| Design inconsistency | Design tokens in `globals.css`, shared components |

---

## Success Criteria (Final)

When someone visits **agenthelm.online**, they understand in under 30 seconds:

1. **What AgentHelm is** — A Project Brain for AI Engineering
2. **Why it matters** — Agents share knowledge instead of forgetting/conflicting
3. **How it works** — Brain Pipeline → Project Brain → Shared Context
4. **How to start** — Install SDK, connect project, begin

---

*CTO-Approved: 2026-07-04*  
*Status: Ready for Phase 1 Execution*