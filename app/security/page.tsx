import React from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ShieldCheck, KeyRound, Lock, Eye, GitBranch, BellRing } from "lucide-react"

export const metadata: Metadata = {
  title: "Security | AgentHelm",
  description:
    "How AgentHelm keeps your agent fleets isolated and your data safe: tenant isolation, hashed credentials, fail-closed controls, and human-in-the-loop governance.",
}

const pillars = [
  {
    icon: Lock,
    title: "Tenant Isolation by Default",
    body: "Every SDK and MCP call is authenticated to a single workspace. A connect key can only ever read or write that workspace's agents, memory, traces, and proposals. We prove this with an automated cross-tenant isolation test that runs on every commit — a key for workspace A can never touch workspace B's data.",
  },
  {
    icon: KeyRound,
    title: "Hashed Credentials, No Plaintext",
    body: "Connect keys are stored only as SHA-256 hashes and never compared as plaintext. Keys are scoped, revocable, and never appear in URLs or logs. Authentication uses signed JWTs (HS256) with short-lived agent tokens.",
  },
  {
    icon: ShieldCheck,
    title: "Fail-Closed Controls",
    body: "Safety is the default, not the exception. If a governance check cannot be performed — a validation error, a permissions defect, a lost connection — the action is denied and logged. Agents never silently proceed past a control that failed to evaluate.",
  },
  {
    icon: BellRing,
    title: "Human-in-the-Loop Gates",
    body: "Irreversible actions (@irreversible) pause and wait for explicit human approval over Telegram or the dashboard before they run. Every approval, denial, and override is recorded with a timestamp for audit.",
  },
  {
    icon: Eye,
    title: "Complete Audit Trail",
    body: "Context injections, knowledge proposals, reasoning steps, and interventions are tracked with immutable, timestamped logs. You can reconstruct exactly what an agent did and why.",
  },
  {
    icon: GitBranch,
    title: "Versioned, Checkpointed State",
    body: "Project Brain state is versioned and checkpointed with integrity hashes, so recovery after an interruption is consistent and verifiable rather than best-effort.",
  },
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-vermilion selection:text-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-line h-14 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-ink font-display font-bold tracking-tight text-lg">AgentHelm</span>
        </Link>
        <Link
          href="/#pricing"
          className="text-[12px] font-mono text-vermilion hover:text-vermilion-dark transition-colors uppercase tracking-widest"
        >
          Start Free →
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-20 pb-24">
        <div className="mb-12 border-l-2 border-vermilion pl-6">
          <p className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] mb-3">
            Trust & Security
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight font-display">
            Security at AgentHelm
          </h1>
          <p className="text-ink-soft mt-4 leading-relaxed">
            AgentHelm governs autonomous agents, so its own security has to be
            provable — not just promised. These are the controls we run, and the
            ones we test on every release.
          </p>
        </div>

        <div className="space-y-4">
          {pillars.map((p) => (
            <section
              key={p.title}
              className="rounded-2xl border border-line bg-paper-card p-6 flex gap-4"
            >
              <div className="w-11 h-11 shrink-0 rounded-xl bg-vermilion-soft flex items-center justify-center">
                <p.icon className="w-5 h-5 text-vermilion" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-ink">{p.title}</h2>
                <p className="text-ink-soft mt-1.5 leading-relaxed text-[15px]">{p.body}</p>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-paper-dim p-6">
          <h2 className="font-display font-bold text-lg text-ink mb-2">Reporting a vulnerability</h2>
          <p className="text-ink-soft leading-relaxed text-[15px]">
            Found something? Email{" "}
            <a
              href="mailto:tharagesharumugam@gmail.com"
              className="text-vermilion font-mono underline underline-offset-2"
            >
              tharagesharumugam@gmail.com
            </a>{" "}
            and we will respond. Responsible disclosure keeps every AgentHelm
            workspace safe.
          </p>
        </div>

        <div className="mt-16 pt-8 border-t border-line flex flex-col items-center gap-3">
          <div className="w-2 h-2 bg-vermilion rounded-full" />
          <p className="text-[10px] font-mono text-muted uppercase tracking-[0.3em]">
            Agent Governance Protocol — Isolation Guaranteed
          </p>
        </div>
      </main>
    </div>
  )
}
