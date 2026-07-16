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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100 font-sans selection:bg-[#ff6b35] selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 bg-[#08080a] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.08),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-mono uppercase tracking-tighter text-white mb-6 leading-tight">
            One Project.
            <br />
            One Brain.
            <br />
            Unlimited AI Agents.
          </h1>
          <p className="text-zinc-400 font-mono text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            AgentHelm gives every AI coding agent a shared Project Brain so they remember architecture, APIs, decisions, and project knowledge instead of starting from scratch.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a href="/login" className="bg-[#ff6b35] hover:bg-[#e0531f] focus-visible:ring-2 focus-visible:ring-[#ff6b35] text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,107,53,0.3)]">
              Get Started Free <span className="w-4 h-4">→</span>
            </a>
            <a href="/docs" className="border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/60 focus-visible:ring-2 focus-visible:ring-zinc-600 font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2">
              Read Documentation <span className="w-4 h-4">→</span>
            </a>
            <a href="https://github.com/jayasukuv11-beep/agenthelm" target="_blank" rel="noopener noreferrer" className="border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/60 focus-visible:ring-2 focus-visible:ring-zinc-600 font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2">
              GitHub <span className="w-4 h-4">→</span>
            </a>
          </div>
          <p className="text-zinc-500 font-mono text-xs mt-6 uppercase tracking-widest">
            Free forever for up to 3 agents · No credit card required
          </p>
        </div>
      </section>

      {/* Hero Animation */}
      <section className="pb-24 px-6 bg-[#08080a]">
        <div className="max-w-6xl mx-auto">
          <HeroAnimation />
        </div>
      </section>

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Brain Pipeline Section */}
      <section className="py-24 px-6 bg-[#08080a] border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-[#ff6b35]/60 uppercase tracking-[0.3em] block mb-3">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
              The <span className="text-[#ff6b35]">Brain Pipeline</span>
            </h2>
            <p className="text-zinc-400 font-mono text-sm max-w-xl mx-auto">
              Knowledge flows through a secure pipeline: proposal → validation → verification → analysis → merge planning → publishing → Project Brain → context injection.
            </p>
          </div>
          <BrainPipelineAnimation />
        </div>
      </section>

      {/* MCP Section */}
      <MCPSection />

      {/* Security Section */}
      <section className="py-24 px-6 bg-[#08080a] border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-[#ff6b35]/60 uppercase tracking-[0.3em] block mb-3">SECURITY ARCHITECTURE</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
              Built-In <span className="text-[#ff6b35]">Security</span>
            </h2>
            <p className="text-zinc-400 font-mono text-sm max-w-xl mx-auto">
              Every layer hardened. Fail-closed by default. JWT agent authentication. Scoped tool permissions. Complete audit logs.
            </p>
          </div>
          <SecurityFeatures />
        </div>
      </section>

      {/* Observability Section */}
      <ObservabilityFeatures />

      {/* SDK Section */}
      <SDKSection />

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Documentation CTA */}
      <DocumentationCTA />

      {/* Footer */}
      <footer className="bg-[#08080a] border-t border-zinc-900 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-zinc-600 text-xs font-mono">
            © {new Date().getFullYear()} AgentHelm · The AgentHelm Research Team
          </p>
          <div className="mt-4 flex justify-center gap-6 text-zinc-500 text-[11px] font-mono">
            <a href="/privacy-policy" className="hover:text-[#ff6b35] transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-[#ff6b35] transition-colors">Terms of Service</a>
            <a href="/refund-policy" className="hover:text-[#ff6b35] transition-colors">Refund Policy</a>
          </div>
          <p className="text-zinc-600 text-[10px] font-mono mt-4">
            Built in India 🇮🇳 · Engineered for global scale
          </p>
        </div>
      </footer>
    </div>
  )
}