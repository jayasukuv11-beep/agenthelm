# AgentHelm — Cursor Project Skill (SKILL.md)
This file is meant to be used as **`.cursorrules`** (or referenced as `@SKILL.md`) so every AI change follows AgentHelm’s conventions.

SECTION 1 — WHO YOU ARE
─────────────────────────
You are the AI pair-programmer for **AgentHelm**, an AI agent monitoring SaaS platform. Developers connect Python/Node agents to stream live logs, track token usage, chat with agents, and receive Telegram alerts from a single dashboard. “Done well” here means: secure multi-tenant Supabase access (RLS + explicit ownership checks), predictable API contracts for the SDK endpoints, zero secret leakage to the client, fast dashboard UX (realtime where it matters), and code that matches existing Next.js App Router + Tailwind + shadcn/ui patterns.

SECTION 2 — ABSOLUTE RULES (Non-Negotiable)
─────────────────────────────────────────────
❌ NEVER: Put `"use client"` anywhere except the very first line in a client component file.  
✅ ALWAYS: Make `"use client";` line 1 (before imports).  
WHY: Next.js determines component boundary from the first directive.

❌ NEVER: Use `any` for Supabase payloads, realtime subscriptions, or API inputs.  
✅ ALWAYS: Define explicit types for request bodies and DB rows (or typed helpers).  
WHY: `any` hides multi-tenant bugs and breaks refactors.

❌ NEVER: Access `process.env.SUPABASE_SERVICE_ROLE_KEY` in client components.  
✅ ALWAYS: Use `SUPABASE_SERVICE_ROLE_KEY` only in server-only contexts (Route Handlers / server utilities).  
WHY: The service role bypasses RLS and must never be exposed.

❌ NEVER: Use the service role key to “avoid thinking about RLS” for dashboard UI.  
✅ ALWAYS: Use anon key + user session for dashboard; rely on RLS for user isolation.  
WHY: Dashboard is multi-tenant; RLS is the contract.

❌ NEVER: Query Supabase tables without filtering by user ownership.  
✅ ALWAYS: Filter by `user_id = auth.uid()` (or equivalent ownership join) in every query.  
WHY: Defense-in-depth: prevents accidental cross-tenant reads/writes.

❌ NEVER: Trust `user_id` from the client for writes.  
✅ ALWAYS: Derive `userId` from `supabase.auth.getUser()` (dashboard) or from validated `connect_key` (SDK routes).  
WHY: Client input is untrusted.

❌ NEVER: Accept SDK requests without validating `connect_key`.  
✅ ALWAYS: Call `validateConnectKey(key)` and handle `{ error, status }` as early return.  
WHY: `connect_key` is the SDK auth primitive.

❌ NEVER: Allow SDK routes to write to an agent without verifying ownership.  
✅ ALWAYS: Verify agent belongs to the connect-key user (`.eq('id', agent_id).eq('user_id', userId)`).  
WHY: Prevents an agent from impersonating another user’s agent.

❌ NEVER: Change the `connect_key` format.  
✅ ALWAYS: Keep it `ahe_live_` + **16 chars** (lowercase a–z + 0–9) exactly.  
WHY: Agents and docs rely on a stable key format.

❌ NEVER: Multiply prices by 100 for display anywhere.  
✅ ALWAYS: Store and display currency consistently; only convert to paise/cents at the payment API call boundary.  
WHY: Prevents billing errors and user trust loss.

❌ NEVER: Use `fetch()` to internal API routes from server components when you can call Supabase directly.  
✅ ALWAYS: Fetch server data via server Supabase client (cookies-based session).  
WHY: Avoids extra hops and keeps auth context correct.

❌ NEVER: Use legacy Next.js `pages/` routing patterns or `getServerSideProps`.  
✅ ALWAYS: Use App Router (`app/`), Server Components, and Route Handlers.  
WHY: Codebase is App Router-first.

❌ NEVER: Import from `next/router`.  
✅ ALWAYS: Use `next/navigation` (`useRouter`, `redirect`, `notFound`).  
WHY: App Router API.

❌ NEVER: Return inconsistent JSON shapes from route handlers.  
✅ ALWAYS: Return `{ success: true, ... }` or `{ error: string }` with the correct HTTP status.  
WHY: SDK + UI depend on stable contracts.

❌ NEVER: Swallow Supabase errors silently.  
✅ ALWAYS: Check `error` and return/throw a structured error response.  
WHY: Silent failures make debugging impossible.

❌ NEVER: Log secrets (keys, tokens, connect keys) in server logs.  
✅ ALWAYS: Log redacted identifiers only (e.g. last 4 chars).  
WHY: Logs are effectively public to operators and vendors.

❌ NEVER: Store huge raw blobs in `message` fields.  
✅ ALWAYS: Put structured payloads in `data` (JSONB) and keep `message` human-readable.  
WHY: Keeps logs usable and queryable.

❌ NEVER: Subscribe to Supabase Realtime without cleanup.  
✅ ALWAYS: Remove channel in cleanup (`supabase.removeChannel(subscription)`).  
WHY: Prevents memory leaks and duplicate events.

❌ NEVER: Create unbounded realtime subscriptions per component instance.  
✅ ALWAYS: One channel per table + filter by `user_id` where possible.  
WHY: Realtime can become expensive quickly.

❌ NEVER: Add new UI components without handling Loading/Error/Empty states.  
✅ ALWAYS: Implement the 4 states: loading, error, empty, success.  
WHY: Dashboard UX must be resilient.

❌ NEVER: Use arbitrary hard-coded colors in many places.  
✅ ALWAYS: Prefer Tailwind + CSS variables; if hard-coding, match the existing palette (e.g. primary `#10b981`).  
WHY: Keeps the dark theme consistent.

❌ NEVER: Import large libraries into client components casually.  
✅ ALWAYS: Keep client bundles lean; prefer server components and small utilities.  
WHY: Performance and responsiveness on low-end devices.

❌ NEVER: Use long-lived in-memory state as a security boundary (rate limit, auth, etc.).  
✅ ALWAYS: Use it only as an MVP performance guardrail and document limits.  
WHY: Serverless/edge runtimes don’t guarantee process persistence.

❌ NEVER: Add new environment variables without updating `.env.example`.  
✅ ALWAYS: Add the var + one-line description to `.env.example` and keep names consistent.  
WHY: Onboarding and deploys depend on it.

SECTION 3 — TECH STACK RULES
──────────────────────────────

### Next.js (App Router)
Version: **14.2.16**
✅ Correct import:
```typescript
import { NextResponse } from "next/server";
```
❌ Wrong import:
```typescript
import { NextApiRequest, NextApiResponse } from "next";
```

Usage rules:
- ✅ **Route Handlers live in `app/api/**/route.ts`**.
```typescript
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: true });
}
```
- ✅ **Use `export const dynamic = "force-dynamic"` for SDK ingestion endpoints** (matching existing routes).
```typescript
export const dynamic = "force-dynamic";
```
- ✅ **Use `next/navigation` for redirects in server context**.
```typescript
import { redirect } from "next/navigation";

export default async function Page() {
  redirect("/dashboard");
}
```

Common mistakes to avoid:
- ❌ Returning raw objects from route handlers  
  ✅ Use `NextResponse.json(...)` with status codes.
- ❌ Mixing Pages Router APIs  
  ✅ Stay App Router-only.

### React
Version: **19.2.3**
✅ Correct import:
```typescript
import { useEffect, useState } from "react";
```
❌ Wrong import:
```typescript
import React from "react";
```

Usage rules:
- ✅ **Client components must start with `"use client";`**.
```typescript
"use client";

import { useState } from "react";
```
- ✅ **Always cleanup side effects** (subscriptions, timers).
```typescript
"use client";

import { useEffect } from "react";

export function Example() {
  useEffect(() => {
    const t = setInterval(() => {}, 1000);
    return () => clearInterval(t);
  }, []);
  return null;
}
```
- ✅ **Prefer derived state** over duplicated state.
```typescript
type Agent = { id: string; status: "running" | "idle" | "stopped" | "error" };
const runningCount = (agents: Agent[]) => agents.filter(a => a.status === "running").length;
```

Common mistakes to avoid:
- ❌ Subscribing in multiple effects without cleanup  
  ✅ One effect, one subscription, cleanup always.
- ❌ Storing computed values in state  
  ✅ Compute from source state when rendering.

### TypeScript
Version: **5.9.3**
✅ Correct import:
```typescript
import type { ReactNode } from "react";
```
❌ Wrong import:
```typescript
// Avoid importing types as values when not needed
import { ReactNode } from "react";
```

Usage rules:
- ✅ **Use `unknown` for untrusted JSON, then validate**.
```typescript
type PingBody = { key: string; name: string; agent_type?: "python" | "node" | "other" };

function assertPingBody(x: unknown): asserts x is PingBody {
  if (!x || typeof x !== "object") throw new Error("Invalid JSON");
  const o = x as Record<string, unknown>;
  if (typeof o.key !== "string") throw new Error("Missing key");
  if (typeof o.name !== "string") throw new Error("Missing name");
}
```
- ✅ **Prefer `type` unions for constrained fields** (matches DB checks).
```typescript
type AgentStatus = "running" | "idle" | "stopped" | "error";
```
- ✅ **Use exhaustive checks for unions**.
```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}
```

Common mistakes to avoid:
- ❌ `any` in API inputs  
  ✅ Validate `unknown`.
- ❌ “Trusting” runtime checks via TS types  
  ✅ TS types are erased; validate at runtime.

### Tailwind CSS
Version: **4.2.1**
✅ Correct import:
```typescript
import "./globals.css";
```
❌ Wrong import:
```typescript
// Don’t add per-component CSS files for common styling
import "./dashboard.css";
```

Usage rules:
- ✅ **Dark mode uses `class`** (matches `tailwind.config.ts`).
```typescript
// Add/remove `class="dark"` on root in layout/theme toggle (if implemented)
```
- ✅ **Use existing palette**: background `#09090b`, primary `#10b981`.
```typescript
const classes = "bg-[#09090b] text-white border border-[#1f2937]";
```
- ✅ **Use `tailwind-merge` for class composition when needed**.
```typescript
import { cn } from "@/lib/utils";

const btn = cn("px-3 py-2", "bg-[#10b981]");
```

Common mistakes to avoid:
- ❌ Duplicating colors in many places  
  ✅ Centralize via CSS vars / Tailwind theme where possible.
- ❌ Overusing arbitrary values without design intent  
  ✅ Use them sparingly and consistently.

### shadcn/ui (Radix primitives)
Version: **components.json style=default, RSC=true**
✅ Correct import:
```typescript
import { Button } from "@/components/ui/button";
```
❌ Wrong import:
```typescript
import { Button } from "@radix-ui/react-button";
```

Usage rules:
- ✅ **Use local `components/ui/*` wrappers** (consistent styling).
```typescript
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
```
- ✅ **Compose variants via existing component props**.
```typescript
import { Button } from "@/components/ui/button";

export function CTA() {
  return <Button variant="outline">Upgrade</Button>;
}
```
- ✅ **Use semantic HTML inside shadcn components**.
```typescript
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Field() {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" />
    </div>
  );
}
```

Common mistakes to avoid:
- ❌ Bypassing local UI wrappers  
  ✅ Keep design system centralized.
- ❌ Inconsistent dark styling overrides  
  ✅ Prefer theme tokens / shared classes.

### Supabase JS
Version: **2.99.1**
✅ Correct import:
```typescript
import { createClient } from "@supabase/supabase-js";
```
❌ Wrong import:
```typescript
import supabase from "supabase";
```

Usage rules:
- ✅ **Browser client uses `@supabase/ssr` `createBrowserClient`**.
```typescript
import { createBrowserClient } from "@supabase/ssr";

export const createBrowserSupabase = (url: string, anonKey: string) =>
  createBrowserClient(url, anonKey);
```
- ✅ **Server client uses cookies from `next/headers`**.
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServerSupabase(url: string, anonKey: string) {
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},
      remove: () => {},
    },
  });
}
```
- ✅ **Service role admin client disables session persistence** (server only).
```typescript
import { createClient } from "@supabase/supabase-js";

export function createAdminSupabase(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

Common mistakes to avoid:
- ❌ Using service role in the browser  
  ✅ Only in server route handlers.
- ❌ Missing ownership filters  
  ✅ Always `.eq("user_id", userId)` or ownership join.

### Gemini (Google Generative AI)
Version: **@google/generative-ai 0.24.1**
✅ Correct import:
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
```
❌ Wrong import:
```typescript
import { Gemini } from "gemini";
```

Usage rules:
- ✅ **Server-only usage** (API routes / server actions).
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function summarize(apiKey: string, text: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const res = await model.generateContent(text);
  return res.response.text();
}
```
- ✅ **Never send raw user secrets to the model**.
```typescript
type SafeLog = { message: string; tokens_used?: number };
```
- ✅ **Track tokens and cost in `credit_usage`**.
```typescript
type CreditUsageInsert = {
  user_id: string;
  agent_id?: string | null;
  tokens_used: number;
  model?: string | null;
  cost_usd?: number;
};
```

Common mistakes to avoid:
- ❌ Running AI in client components  
  ✅ Keep on server.
- ❌ Not recording token usage  
  ✅ Insert into `credit_usage`.

### next-pwa
Version: **5.6.0**
✅ Correct import:
```typescript
import withPWA from "next-pwa";
```
❌ Wrong import:
```typescript
import { withPWA } from "next-pwa";
```

Usage rules:
- ✅ **Disable PWA in development** (matches `next.config.mjs`).
```typescript
const disable = process.env.NODE_ENV === "development";
```
- ✅ **Build assets land in `public/`**.
```typescript
// public/sw.js, public/workbox-*.js
```
- ✅ **Avoid caching authenticated HTML**.
```typescript
type PWAGuideline = { neverCache: "authenticated pages" };
```

Common mistakes to avoid:
- ❌ Caching session-dependent pages  
  ✅ Cache static assets only.
- ❌ Debugging PWA while enabled in dev  
  ✅ Keep disabled in development.

SECTION 4 — FILE STRUCTURE
────────────────────────────
Folder tree (current):

```typescript
// app/
//   (auth)/
//     login/page.tsx
//     onboarding/page.tsx
//     verify-otp/page.tsx
//   (dashboard)/
//     layout.tsx
//     dashboard/page.tsx
//   api/
//     sdk/
//       ping/route.ts
//       log/route.ts
//       output/route.ts
//       command/route.ts
//     webhooks/
//       cashfree/
//     telegram/
//     chat/
//   favicon.ico
//   globals.css
//   layout.tsx
//   page.tsx
// components/
//   dashboard/
//     AgentCard.tsx
//     StatsRow.tsx
//   ui/
//     button.tsx
//     card.tsx
//     dialog.tsx
//     input.tsx
//     label.tsx
//     badge.tsx
// lib/
//   supabase/
//     client.ts
//     server.ts
//     middleware.ts
//   sdk-auth.ts
//   utils.ts
// supabase/
//   migrations/*.sql
// public/
//   sw.js
//   workbox-*.js
// sdk/
//   python/...
//   node/...
```

`app/`:
  Purpose: Next.js App Router pages/layouts and Route Handlers.  
  Never put here: reusable UI primitives (use `components/`).  
  Naming convention: route segments use Next conventions; files are `layout.tsx`, `page.tsx`, `route.ts`.

`app/(auth)/`:
  Purpose: auth pages (login, OTP verify, onboarding).  
  Never put here: dashboard-only components.  
  Naming convention: route segment folders are kebab-case if added (e.g. `reset-password`).

`app/(dashboard)/`:
  Purpose: authenticated dashboard area; layout + pages.  
  Never put here: SDK ingestion API logic.  
  Naming convention: `dashboard/page.tsx` for root dashboard route.

`app/api/`:
  Purpose: server-only endpoints (SDK ingestion, webhooks, telegram).  
  Never put here: client-only helpers; secrets must stay server-side.  
  Naming convention: `route.ts` per endpoint; group by domain (`sdk`, `webhooks`).

`components/`:
  Purpose: reusable UI components and feature components.  
  Never put here: data access (Supabase) or server secrets.  
  Naming convention: PascalCase `.tsx` files for components.

`components/ui/`:
  Purpose: shadcn/ui wrappers + Radix primitives; single source of truth for UI tokens.  
  Never put here: feature logic.  
  Naming convention: kebab-case filenames (e.g. `button.tsx`).

`lib/`:
  Purpose: app utilities, auth helpers, Supabase client factories.  
  Never put here: UI components.  
  Naming convention: kebab-case or flat names matching usage (current: `sdk-auth.ts`).

`supabase/`:
  Purpose: schema migrations + RLS policies.  
  Never put here: application logic.  
  Naming convention: numeric ordered migrations `00x_description.sql`.

`sdk/`:
  Purpose: language SDKs (Python/Node) to ship to users.  
  Never put here: webapp code.  
  Naming convention: language folders; package-specific conventions inside.

SECTION 5 — CODE PATTERNS
───────────────────────────

### API Route Pattern
```typescript
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { validateConnectKey } from "@/lib/sdk-auth";

type JsonError = { error: string };
type JsonSuccess<T extends object> = { success: true } & T;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message } satisfies JsonError, { status });
}

type Body = {
  key: string;
  agent_id: string;
  message: string;
  level?: "info" | "warning" | "error" | "success";
};

function assertBody(x: unknown): asserts x is Body {
  if (!x || typeof x !== "object") throw new Error("Invalid JSON");
  const o = x as Record<string, unknown>;
  if (typeof o.key !== "string") throw new Error("Missing key");
  if (typeof o.agent_id !== "string") throw new Error("Missing agent_id");
  if (typeof o.message !== "string") throw new Error("Missing message");
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    assertBody(raw);
    const { key, agent_id, message, level = "info" } = raw;

    const auth = await validateConnectKey(key);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { userId, supabaseAdmin } = auth;

    const { data: agent, error: agentErr } = await supabaseAdmin!
      .from("agents")
      .select("id")
      .eq("id", agent_id)
      .eq("user_id", userId)
      .single();

    if (agentErr) return jsonError("Failed to verify agent ownership", 500);
    if (!agent) return jsonError("Agent not found or unauthorized", 403);

    const { error: insertErr } = await supabaseAdmin!
      .from("agent_logs")
      .insert({
        agent_id,
        type: "log",
        level,
        message,
        data: null,
        tokens_used: 0,
        model: null,
      });

    if (insertErr) return jsonError("Failed to insert log", 500);

    return NextResponse.json({ success: true } satisfies JsonSuccess<{}>);
  } catch (e) {
    return jsonError("Internal Server Error", 500);
  }
}
```

### Page Component Pattern (Server)
```typescript
import { createClient } from "@/lib/supabase/server";

type AgentRow = {
  id: string;
  user_id: string;
  name: string;
  status: "running" | "idle" | "stopped" | "error";
  created_at: string;
};

export default async function DashboardServerPage() {
  const supabase = createClient();
  const { data: authData, error: authErr } = await supabase.auth.getUser();

  if (authErr) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
          <p className="text-sm text-gray-400">Error</p>
          <p className="mt-1 font-medium">Failed to load session.</p>
        </div>
      </div>
    );
  }

  const user = authData.user;
  if (!user) {
    return (
      <div className="p-6 text-white">
        <p className="text-gray-400">You’re not signed in.</p>
      </div>
    );
  }

  const { data: agents, error } = await supabase
    .from("agents")
    .select("id,user_id,name,status,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<AgentRow[]>();

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-lg border border-[#1f2937] bg-[#111111] p-4">
          <p className="text-sm text-gray-400">Error</p>
          <p className="mt-1 font-medium">Failed to load agents.</p>
        </div>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-lg border border-dashed border-[#1f2937] bg-[#111111] p-6 text-center">
          <p className="font-medium">No agents connected</p>
          <p className="mt-1 text-sm text-gray-400">Connect your first agent to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <ul className="space-y-2">
        {agents.map(a => (
          <li key={a.id} className="rounded border border-[#1f2937] bg-[#111111] p-3">
            <p className="font-medium">{a.name}</p>
            <p className="text-sm text-gray-400">{a.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Page Component Pattern (Client)
```typescript
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Agent = {
  id: string;
  user_id: string;
  name: string;
  status: "running" | "idle" | "stopped" | "error";
  created_at: string;
};

export function AgentsWidget() {
  const supabase = useMemo(() => createClient(), []);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authErr || !authData.user) {
        setError("Not signed in");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      const { data, error: qErr } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<Agent[]>();

      if (cancelled) return;
      if (qErr) {
        setError("Failed to load agents");
        setLoading(false);
        return;
      }

      setAgents(data ?? []);
      setLoading(false);

      const channel = supabase
        .channel("public:agents")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agents", filter: `user_id=eq.${userId}` },
          async () => {
            const { data: refreshed } = await supabase
              .from("agents")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .returns<Agent[]>();
            if (!cancelled) setAgents(refreshed ?? []);
          }
        )
        .subscribe();

      subscription = { unsubscribe: () => supabase.removeChannel(channel) };
    }

    load();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  if (loading) return <div className="animate-pulse text-gray-400">Loading…</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (agents.length === 0) return <div className="text-gray-400">No agents yet.</div>;

  return (
    <div className="space-y-2">
      {agents.map(a => (
        <div key={a.id} className="rounded border border-[#1f2937] bg-[#111111] p-3 text-white">
          <div className="flex items-center justify-between">
            <span className="font-medium">{a.name}</span>
            <span className="text-sm text-gray-400">{a.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Supabase Query Pattern
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

type AgentRow = {
  id: string;
  user_id: string;
  name: string;
  status: "running" | "idle" | "stopped" | "error";
  agent_type: "python" | "node" | "other";
  version: string | null;
  last_ping: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

export async function listAgentsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: AgentRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<AgentRow[]>();

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}
```

### Supabase Realtime Pattern
```typescript
"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAgentsRealtime(userId: string, onChange: () => void) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel("public:agents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents", filter: `user_id=eq.${userId}` },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, onChange]);
}
```

### Form Pattern
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; message: string };

function isEmail(x: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

export function EmailOtpForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setState({ status: "error", message: "Enter a valid email address." });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/auth/start-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? "Failed to send OTP.";
        setState({ status: "error", message: msg });
        return;
      }
      setState({ status: "success" });
    } catch {
      setState({ status: "error", message: "Network error. Try again." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-[#1a1a1a] border-[#2d3748] text-white"
        />
      </div>

      {state.status === "error" ? (
        <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {state.message}
        </div>
      ) : null}
      {state.status === "success" ? (
        <div className="rounded border border-[#10b981]/40 bg-[#10b981]/10 p-3 text-sm text-emerald-200">
          OTP sent. Check your email.
        </div>
      ) : null}

      <Button
        type="submit"
        className="bg-[#10b981] hover:bg-[#059669] text-white"
        disabled={state.status === "loading"}
      >
        {state.status === "loading" ? "Sending…" : "Send OTP"}
      </Button>
    </form>
  );
}
```

SECTION 6 — DATABASE RULES
────────────────────────────
AgentHelm uses Supabase Postgres with RLS enabled on all tables. Tables are defined by migrations in `supabase/migrations/*`.

### profiles
Purpose: One row per user (mirrors `auth.users`) with onboarding + plan + `connect_key`.  
Key columns: `id uuid (PK, auth.users FK)`, `email text`, `connect_key text`, `plan text`, `telegram_chat_id text`, `tokens_limit_monthly bigint`, `onboarding_complete boolean`, `created_at timestamptz`.  
Always query with: `id = auth.uid()` in dashboard flows (or `connect_key` when validating SDK key using admin client).  
Never do: select all profiles; update `connect_key` manually; expose `connect_key` publicly.  
RLS policy: user can only access their own row (`auth.uid() = id`).  
Example query:
```typescript
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  connect_key: string;
  plan: "free" | "indie" | "studio";
  onboarding_complete: boolean;
};

export async function getMyProfile() {
  const supabase = createClient();
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) return { profile: null, error: "Not signed in" };

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,connect_key,plan,onboarding_complete")
    .eq("id", authData.user.id)
    .single()
    .returns<Profile>();

  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}
```

### agents
Purpose: Registered agents owned by a user; status + metadata + last ping.  
Key columns: `id uuid`, `user_id uuid`, `name text`, `status text`, `agent_type text`, `version text`, `last_ping timestamptz`, `error_message text`, `metadata jsonb`, `is_active boolean`, `created_at timestamptz`.  
Always query with: `.eq("user_id", auth.uid())` (dashboard) or `.eq("user_id", userId)` after connect-key validation (SDK).  
Never do: update status without ensuring ownership; allow non-owner access by agent id.  
RLS policy: owner-only (`user_id = auth.uid()`).  
Example query:
```typescript
import { createClient } from "@/lib/supabase/client";

type Agent = {
  id: string;
  user_id: string;
  name: string;
  status: "running" | "idle" | "stopped" | "error";
  agent_type: "python" | "node" | "other";
  last_ping: string | null;
};

export async function listMyAgents() {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { agents: [], error: "Not signed in" };

  const { data, error } = await supabase
    .from("agents")
    .select("id,user_id,name,status,agent_type,last_ping")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .returns<Agent[]>();

  if (error) return { agents: [], error: error.message };
  return { agents: data ?? [], error: null };
}
```

### agent_logs
Purpose: Append-only log stream for each agent (includes tokens + chat replies).  
Key columns: `id uuid`, `agent_id uuid`, `type text`, `level text`, `message text`, `data jsonb`, `tokens_used int`, `model text`, `created_at timestamptz`.  
Always query with: ownership through agent: `agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())`.  
Never do: read by `agent_id` without verifying ownership; store secrets in `data`.  
RLS policy: owner-through-agent.  
Example query:
```typescript
import { createClient } from "@/lib/supabase/client";

type AgentLog = {
  id: string;
  agent_id: string;
  type: "log" | "error" | "output" | "tokens" | "chat_reply";
  level: "info" | "warning" | "error" | "success";
  message: string;
  data: Record<string, unknown> | null;
  created_at: string;
};

export async function listLogs(agentId: string) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { logs: [], error: "Not signed in" };

  // Ownership is enforced by RLS; still validate agent ownership if needed by UI.
  const { data, error } = await supabase
    .from("agent_logs")
    .select("id,agent_id,type,level,message,data,created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<AgentLog[]>();

  if (error) return { logs: [], error: error.message };
  return { logs: data ?? [], error: null };
}
```

### credit_usage
Purpose: Token usage + estimated cost per user/agent.  
Key columns: `id uuid`, `user_id uuid`, `agent_id uuid`, `tokens_used int`, `model text`, `cost_usd decimal`, `created_at timestamptz`.  
Always query with: `.eq("user_id", auth.uid())`.  
Never do: aggregate across users; accept user_id from client.  
RLS policy: owner-only.  
Example query:
```typescript
import { createClient } from "@/lib/supabase/client";

type CreditUsage = { tokens_used: number; cost_usd: string };

export async function todayUsage() {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { tokens: 0, cost: 0, error: "Not signed in" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("credit_usage")
    .select("tokens_used,cost_usd")
    .eq("user_id", authData.user.id)
    .gte("created_at", today.toISOString())
    .returns<CreditUsage[]>();

  if (error) return { tokens: 0, cost: 0, error: error.message };

  let tokens = 0;
  let cost = 0;
  for (const row of data ?? []) {
    tokens += row.tokens_used;
    cost += Number(row.cost_usd);
  }
  return { tokens, cost, error: null };
}
```

### agent_chats
Purpose: Chat messages between user and agent (dashboard/telegram).  
Key columns: `id uuid`, `agent_id uuid`, `user_id uuid`, `role text`, `content text`, `source text`, `created_at timestamptz`.  
Always query with: `.eq("user_id", auth.uid())` and optionally `.eq("agent_id", ...)`.  
Never do: rely only on agent_id without user filter in client queries.  
RLS policy: owner-only by `user_id`.  
Example query:
```typescript
import { createClient } from "@/lib/supabase/client";

type ChatRow = {
  id: string;
  agent_id: string;
  user_id: string;
  role: "user" | "agent";
  content: string;
  source: "dashboard" | "telegram";
  created_at: string;
};

export async function listChat(agentId: string) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { chat: [], error: "Not signed in" };

  const { data, error } = await supabase
    .from("agent_chats")
    .select("*")
    .eq("user_id", authData.user.id)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true })
    .returns<ChatRow[]>();

  if (error) return { chat: [], error: error.message };
  return { chat: data ?? [], error: null };
}
```

### agent_commands
Purpose: Commands queued for agents (stop/start/restart/chat/custom).  
Key columns: `id uuid`, `agent_id uuid`, `command_type text`, `payload jsonb`, `status text`, `created_at timestamptz`.  
Always query with: agent ownership (RLS policy checks via agent ownership join).  
Never do: deliver commands without marking them delivered; accept arbitrary command_type.  
RLS policy: commands visible if agent belongs to user.  
Example query:
```typescript
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { validateConnectKey } from "@/lib/sdk-auth";

type Command = {
  id: string;
  agent_id: string;
  command_type: "stop" | "start" | "restart" | "chat" | "custom";
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "completed";
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const agent_id = searchParams.get("agent_id");
    if (!agent_id) return NextResponse.json({ error: "Missing agent_id" }, { status: 400 });

    const auth = await validateConnectKey(key);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { supabaseAdmin } = auth;
    const { data, error } = await supabaseAdmin!
      .from("agent_commands")
      .select("*")
      .eq("agent_id", agent_id)
      .eq("status", "pending")
      .returns<Command[]>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ids = (data ?? []).map(c => c.id);
    if (ids.length) {
      await supabaseAdmin!.from("agent_commands").update({ status: "delivered" }).in("id", ids);
    }

    return NextResponse.json({ commands: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

SECTION 7 — SECURITY RULES
────────────────────────────

Environment variables:

| Variable | Client-safe? | Where used | WHY |
|---|---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | browser + server | Supabase URL is not secret; required to connect. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | browser + server | Public anon key is safe; RLS protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ No | server only | Bypasses RLS; must never reach client. |
| `GEMINI_API_KEY` | ❌ No | server only | Paid API key; prevents abuse and leakage. |
| `TELEGRAM_BOT_TOKEN` | ❌ No | server only | Bot control; exposure allows takeover. |
| `TELEGRAM_WEBHOOK_URL` | ❌ No | server only | Used for webhook registration; treat as server config. |
| `CASHFREE_APP_ID` | ❌ No | server only | Payment credential. |
| `CASHFREE_SECRET_KEY` | ❌ No | server only | Payment secret. |
| `CASHFREE_WEBHOOK_SECRET` | ❌ No | server only | Webhook verification secret. |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | browser + server | Public site URL. |
| `ENCRYPTION_KEY` | ❌ No | server only | Used for crypto; disclosure breaks security. |

User data isolation (ownership verification):
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertAgentOwnership(
  supabaseAdmin: SupabaseClient,
  userId: string,
  agentId: string
) {
  const { data: agent, error } = await supabaseAdmin
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .eq("user_id", userId)
    .single();

  if (error) throw new Error("Ownership query failed");
  if (!agent) throw new Error("Agent not found or unauthorized");
}
```

What to never expose:
- `SUPABASE_SERVICE_ROLE_KEY`: bypasses RLS (full DB access).
- `GEMINI_API_KEY`: billable key.
- `TELEGRAM_BOT_TOKEN`: can send/receive messages as your bot.
- Payment secrets: can create charges or accept forged webhooks.
- Raw `connect_key`: treat as an API key; only show to the authenticated owner inside the dashboard UI.

Input validation pattern:
```typescript
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseString(x: unknown, name: string): Result<string> {
  if (typeof x !== "string" || x.trim() === "") return { ok: false, error: `Missing ${name}` };
  return { ok: true, value: x };
}
```

SECTION 8 — UI/UX RULES
─────────────────────────

Design system (AgentHelm dark theme):

Colors:

| Token | Hex / Value | Use | WHY |
|---|---|---|---|
| `background` | `#09090b` | app background | Matches `tailwind.config.ts` and current pages. |
| `surface` | `#111111` | cards/panels | Consistent dashboard surface. |
| `border` | `#1f2937` | subtle borders | Keeps UI structured without noise. |
| `primary` | `#10b981` | primary CTA | Brand accent; used on buttons and highlights. |
| `primaryHover` | `#059669` | hover state | Accessible hover contrast. |
| `mutedText` | `#9ca3af` | secondary text | Readable on dark background. |

Typography:

| Style | Tailwind | Use | WHY |
|---|---|---|---|
| H1 | `text-3xl font-bold tracking-tight` | page titles | Matches dashboard. |
| H2 | `text-xl font-semibold` | section headers | Clear hierarchy. |
| Body | `text-sm text-gray-400` | secondary text | Consistent muted copy. |
| Mono | `font-mono text-sm` | keys/commands | Distinguish code-like content. |

Spacing:
- ✅ Use `space-y-*` stacks for vertical rhythm (e.g. `space-y-6` for pages).
- ✅ Use `gap-4` for responsive rows/grids.
- ✅ Use `p-6` for main page padding; `p-3`/`p-4` for cards.

Components (shadcn/ui usage):
- ✅ Use `Button`, `Input`, `Dialog` from `@/components/ui/*`.
- ✅ Keep dialogs dark: `bg-[#111111] border-[#1f2937] text-white`.
- ❌ Don’t import Radix primitives directly in feature pages (except inside `components/ui/*`).

States to always handle:

Loading (exact pattern):
```typescript
export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-24 bg-[#111111] border border-[#1f2937] rounded-lg"></div>
      <div className="h-64 bg-[#111111] border border-[#1f2937] rounded-lg"></div>
    </div>
  );
}
```

Error (exact pattern):
```typescript
export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200">
      {message}
    </div>
  );
}
```

Empty (exact pattern):
```typescript
import { Inbox } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#111111] border border-[#1f2937] border-dashed rounded-lg text-center">
      <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-sm">{body}</p>
    </div>
  );
}
```

Success (exact pattern):
```typescript
export function SuccessPanel({ message }: { message: string }) {
  return (
    <div className="rounded border border-[#10b981]/40 bg-[#10b981]/10 p-3 text-sm text-emerald-200">
      {message}
    </div>
  );
}
```

Mobile rules:
- ✅ Breakpoints: use Tailwind defaults; prioritize `sm:` for stacking toolbars and dialogs.
- ✅ Avoid horizontal overflow; prefer `flex-col sm:flex-row`.
- ✅ Buttons should be at least `h-10` with comfortable padding.

SECTION 9 — NAMING CONVENTIONS
─────────────────────────────────
- Files: ❌ `MyComponent.tsx` in `components/ui` ✅ `button.tsx` (kebab-case) in `components/ui` WHY: shadcn convention.  
- Folders: ✅ route segment folders are kebab-case (`reset-password`) WHY: URL readability.  
- Components: ✅ `PascalCase` (`AgentCard`) WHY: React convention.  
- Functions: ✅ `camelCase` (`validateConnectKey`) WHY: TS convention.  
- Variables: ✅ `camelCase` (`connectKey`) WHY: readability.  
- Types/Interfaces: ✅ `PascalCase` (`AgentRow`) WHY: TS convention.  
- API routes: ✅ `app/api/<domain>/<action>/route.ts` WHY: predictable endpoints.  
- DB tables: ✅ snake_case plural (`agent_logs`, `credit_usage`) WHY: matches existing schema.  
- DB columns: ✅ snake_case (`user_id`, `created_at`) WHY: consistent SQL style.  
- Environment variables: ✅ `SCREAMING_SNAKE_CASE` (and `NEXT_PUBLIC_` for client safe) WHY: Next.js convention.  
- CSS classes: ✅ Tailwind utility classes; if custom, use `kebab-case` WHY: consistency.  
- Git commits: ✅ imperative present tense (“add sdk log route”) WHY: readable history.

SECTION 10 — ERROR HANDLING
─────────────────────────────

API errors (standard response format):
```typescript
import { NextResponse } from "next/server";

export type ApiError = { error: string };
export type ApiOk<T extends object> = { success: true } & T;

export function ok<T extends object>(data: T) {
  return NextResponse.json({ success: true, ...data } satisfies ApiOk<T>);
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message } satisfies ApiError, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message } satisfies ApiError, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message } satisfies ApiError, { status: 403 });
}

export function serverError(message = "Internal Server Error") {
  return NextResponse.json({ error: message } satisfies ApiError, { status: 500 });
}
```

Toast notifications:
- ✅ Success: after user-initiated actions complete (connect agent, copy key, upgrade plan). WHY: positive feedback.
- ✅ Error: when an action fails and user can retry. WHY: actionable feedback.
- ✅ Warning: for limits (rate limit, plan token cap). WHY: prevents confusion.
- ✅ Info: background events (agent status changed). WHY: avoids alarming the user.

Form errors:
- ✅ Inline field errors for validation; top-level panel for server/network errors. WHY: clarity.

Console logging:
- ✅ Server: `console.error("<route> error:", err)` but never include secrets. WHY: observability without leakage.
- ✅ Client: log only when debugging locally; remove noisy logs. WHY: performance/clean UX.

User-facing standard error messages:
- “Not signed in”
- “Rate limit exceeded (6 per min)”
- “Agent not found or unauthorized”
- “Network error. Try again.”
- “Internal Server Error”

SECTION 11 — PERFORMANCE RULES
────────────────────────────────
- Server vs Client components:
  - ✅ Prefer Server Components for initial data fetch and protected pages. WHY: smaller bundles, better TTFB.
  - ✅ Use Client Components for realtime subscriptions, interactions, dialogs. WHY: needs hooks.
- Image optimization:
  - ✅ Configure domains in `next.config.mjs` (already includes Supabase). WHY: Next Image safety.
- Database query optimization:
  - ✅ Select only necessary columns for lists. WHY: lower latency/cost.
  - ✅ Use indexes already present (user_id, created_at). WHY: predictable performance.
- Bundle size:
  - ❌ Don’t import heavy charting libs into broad client layouts. ✅ Lazy-load charts. WHY: keeps dashboard snappy.
- Caching strategy:
  - ✅ SDK ingestion routes are `force-dynamic`. WHY: realtime-ish writes.
  - ✅ Avoid caching user-private HTML pages in PWA. WHY: security correctness.
- Realtime subscription limits:
  - ✅ Keep channels minimal (e.g. one `agents` channel with user filter). WHY: cost + event storm prevention.

SECTION 12 — TESTING CHECKLIST
────────────────────────────────

Build checks:
☐ `npm run build` passes  
☐ `npx tsc --noEmit` passes  
☐ `npm run lint` passes

Manual checks for every page:
☐ Loading state renders (slow network simulation)  
☐ Empty state renders (new account)  
☐ Error state renders (Supabase denied / API failure)

Security checks:
☐ No client bundle contains `SUPABASE_SERVICE_ROLE_KEY` (search built output)  
☐ All DB queries include ownership constraints (`user_id`, or RLS join via agent)

Mobile checks:
☐ Toolbar stacks correctly on `sm` and below  
☐ Dialogs are usable on small screens (no overflow)

SECTION 13 — ANTIGRAVITY / CURSOR WORKFLOW
────────────────────────────────────────────

Use Claude Opus 4.6 Thinking for:
- Designing new domains (payments, webhooks, billing state machines)
- Complex security/RLS policy design and audit
- Large refactors across `app/`, `components/`, `lib/`

Use Claude Sonnet 4.6 Thinking for:
- Implementing new dashboard pages/components
- Adding new SDK endpoints with validation + ownership checks
- Improving UI states and interaction flows

Use Gemini 3.1 Pro High for:
- Generating robust test plans
- Reviewing error handling edge cases and performance trade-offs

Use Gemini 3 Flash for:
- Quick code edits, small components, tiny refactors
- Writing concise utilities and type definitions

Prompt structure to always use:
```typescript
type CursorTaskPrompt = {
  goal: string;
  context: {
    files: string[];
    constraints: string[];
    apiContracts?: string[];
    dbTables?: string[];
  };
  acceptanceCriteria: string[];
  testPlan?: string[];
};
```

Example:
```typescript
const prompt: CursorTaskPrompt = {
  goal: "Add SDK endpoint to mark command completed",
  context: {
    files: ["app/api/sdk/command/route.ts", "lib/sdk-auth.ts"],
    constraints: [
      "Validate connect_key",
      "Verify agent ownership",
      "Return { success: true } on success",
      "Never expose service role key to client",
    ],
    dbTables: ["agent_commands", "agents"],
  },
  acceptanceCriteria: [
    "GET keeps delivering pending commands and marks delivered",
    "POST can mark command completed only for owner agent",
  ],
  testPlan: ["Call endpoint with invalid key -> 401", "Valid key but wrong agent -> 403", "Valid -> 200"],
};
```

