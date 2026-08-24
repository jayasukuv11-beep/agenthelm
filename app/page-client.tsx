'use client';

import React from "react";
import IntegrationsSection from '@/components/landing/IntegrationsSection'
import DocumentationCTA from '@/components/landing/DocumentationCTA'
import SDKSection from '@/components/landing/SDKSection'
import ObservabilityFeatures from '@/components/landing/ObservabilityFeatures'
import SecurityFeatures from '@/components/landing/SecurityFeatures'
import BrainPipelineAnimation from '@/components/landing/BrainPipelineAnimation'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'
import MCPSection from '@/components/landing/MCPSection'
import PricingSection from '@/components/landing/PricingSection'
import HeroAnimation from '@/components/landing/HeroAnimation'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased selection:bg-vermilion selection:text-white">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto h-16 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight text-ink">AgentHelm</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-ink-soft">
            <a href="#problem" className="hover:text-ink transition-colors">Problem</a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
            <a href="#security" className="hover:text-ink transition-colors">Security</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-ink-soft hover:text-ink transition-colors hidden sm:block">Sign in</a>
            <a href="/login" className="bg-vermilion hover:bg-vermilion-dark text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vermilion-soft border border-vermilion/20 text-vermilion text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-vermilion" />
            v1.0 — Control plane for AI agents, live
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight text-ink leading-[1.05] max-w-4xl">
            The control plane that keeps your AI agents safe in production.
          </h1>

          <p className="mt-6 text-lg text-ink-soft leading-relaxed max-w-2xl">
            AgentHelm wraps any agent framework with human-in-the-loop approvals, audit trails,
            budget guardrails, and a shared Project Brain — so autonomous agents stay
            accountable, on-budget, and recoverable.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="/login" className="bg-vermilion hover:bg-vermilion-dark text-white font-medium text-sm px-6 py-3.5 rounded-lg transition-colors inline-flex items-center gap-2">
              Start free <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/docs" className="border border-line bg-paper-card hover:border-ink-soft text-ink font-medium text-sm px-6 py-3.5 rounded-lg transition-colors">
              Read the docs
            </a>
            <a href="https://github.com/jayasukuv11-beep/agenthelm" target="_blank" rel="noopener noreferrer" className="text-ink-soft hover:text-ink font-medium text-sm px-2 py-3.5 transition-colors">
              GitHub
            </a>
          </div>

          <p className="mt-5 text-xs text-muted font-mono">
            Free for 1 agent &amp; 1 project · No credit card required
          </p>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────── */}
      <section className="px-6 border-y border-line bg-paper-dim/50">
        <div className="max-w-6xl mx-auto py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono text-muted">
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-moss" /> Fail-closed by default</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-moss" /> Tenant-isolated</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-moss" /> Telegram HITL</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-moss" /> Full audit trail</span>
        </div>
      </section>

      {/* ── Hero animation ─────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <HeroAnimation />
        </div>
      </section>

      {/* ── Problem / Solution ─────────────────────────────────── */}
      <ProblemSection />
      <SolutionSection />

      {/* ── How it works: Brain Pipeline ───────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-paper-dim/40 border-y border-line">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
              The Brain Pipeline
            </h2>
            <p className="text-ink-soft text-sm max-w-2xl mx-auto leading-relaxed">
              Knowledge flows through a secure pipeline: proposal → noise filter → validation →
              verification → analysis → merge planning → publishing → Project Brain → context injection.
            </p>
          </div>
          <BrainPipelineAnimation />
        </div>
      </section>

      {/* ── MCP ────────────────────────────────────────────────── */}
      <MCPSection />

      {/* ── Security ───────────────────────────────────────────── */}
      <section id="security" className="py-24 px-6 bg-paper">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">SECURITY ARCHITECTURE</span>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
              Built to be governed
            </h2>
            <p className="text-ink-soft text-sm max-w-xl mx-auto leading-relaxed">
              Every layer hardened. Fail-closed by default. Scoped credentials, tenant isolation,
              and a complete audit trail.
            </p>
          </div>
          <SecurityFeatures />
        </div>
      </section>

      {/* ── Observability ─────────────────────────────────────── */}
      <ObservabilityFeatures />

      {/* ── SDK ────────────────────────────────────────────────── */}
      <SDKSection />

      {/* ── Integrations ───────────────────────────────────────── */}
      <IntegrationsSection />

      {/* ── Pricing ───────────────────────────────────────────── */}
      <PricingSection />

      {/* ── Documentation CTA ─────────────────────────────────── */}
      <DocumentationCTA />

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-ink text-paper-dim pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <span className="font-display font-bold text-lg text-paper tracking-tight">AgentHelm</span>
            <p className="text-paper-dim/70 text-sm mt-2 max-w-xs leading-relaxed">
              The control plane for autonomous AI agent fleets.
            </p>
          </div>
          <div className="flex flex-wrap gap-12 text-sm">
            <div className="space-y-2">
              <p className="text-paper font-semibold mb-1">Product</p>
              <a href="#how-it-works" className="block text-paper-dim/70 hover:text-paper transition-colors">How it works</a>
              <a href="#security" className="block text-paper-dim/70 hover:text-paper transition-colors">Security</a>
              <a href="#pricing" className="block text-paper-dim/70 hover:text-paper transition-colors">Pricing</a>
            </div>
            <div className="space-y-2">
              <p className="text-paper font-semibold mb-1">Resources</p>
              <a href="/docs" className="block text-paper-dim/70 hover:text-paper transition-colors">Docs</a>
              <a href="https://github.com/jayasukuv11-beep/agenthelm" className="block text-paper-dim/70 hover:text-paper transition-colors">GitHub</a>
              <a href="https://agenthelm.online" className="block text-paper-dim/70 hover:text-paper transition-colors">Dashboard</a>
            </div>
            <div className="space-y-2">
              <p className="text-paper font-semibold mb-1">Legal</p>
              <a href="/privacy-policy" className="block text-paper-dim/70 hover:text-paper transition-colors">Privacy</a>
              <a href="/terms-of-service" className="block text-paper-dim/70 hover:text-paper transition-colors">Terms</a>
              <a href="/refund-policy" className="block text-paper-dim/70 hover:text-paper transition-colors">Refund</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-paper/10 flex flex-col md:flex-row justify-between gap-3 text-xs text-paper-dim/50">
          <p>© {new Date().getFullYear()} AgentHelm. All rights reserved.</p>
          <p className="font-mono">Engineered for production-scale agent governance</p>
        </div>
      </footer>
    </div>
  )
}
