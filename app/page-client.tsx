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
import ArchitectureSection from '@/components/landing/ArchitectureSection'
import PricingSection from '@/components/landing/PricingSection'
import HeroAnimation from '@/components/landing/HeroAnimation'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-mono uppercase tracking-tighter text-white mb-6">
            One Project.
            <br />
            One Brain.
            <br />
            Unlimited AI Agents.
          </h1>
          <p className="text-zinc-400 font-mono text-lg max-w-xl mx-auto mb-12">
            AgentHelm gives every AI coding agent a shared Project Brain so they remember architecture, APIs, decisions, and project knowledge instead of starting from scratch.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,87,34,0.4)]">
              Get Started Free <span className="w-4 h-4">→</span>
            </a>
            <a href="/docs" className="border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2">
              Read Documentation <span className="w-4 h-4">→</span>
            </a>
            <a href="https://github.com/jayasukuv11-beep/agenthelm" className="border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2">
              GitHub <span className="w-4 h-4">→</span>
            </a>
          </div>
          <p className="text-zinc-500 font-mono text-sm mt-6">
            Free forever for up to 3 agents. No credit card. Deploy in minutes.
          </p>
        </div>
      </section>

      {/* Hero Animation */}
      <section className="pt-20 pb-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <HeroAnimation />
        </div>
      </section>

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Brain Pipeline Section */}
      <section className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
              The <span className="text-orange-500">Brain Pipeline</span>
            </h2>
            <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
              Knowledge flows through a secure pipeline: proposal → validation → verification → analysis → merge planning → publishing → Project Brain → context injection.
            </p>
          </div>
          <BrainPipelineAnimation />
        </div>
      </section>

      {/* Architecture Section */}
      <ArchitectureSection />

      {/* Security Section */}
      <section className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">SECURITY</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
              Built-In <span className="text-orange-500">Security</span>
            </h2>
            <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
              Every layer hardened. Fail-closed by default. No secrets in the brain. No unauthorized tool calls. Full audit trail.
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
      <footer className="bg-[#0a0a0a] border-t border-zinc-800 pt-12 pb-6 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-zinc-600 text-xs font-mono">
            © {new Date().getFullYear()} AgentHelm · The AgentHelm Research Team
          </p>
          <div className="mt-4 flex justify-center gap-6 text-zinc-500 text-[11px] font-mono">
            <a href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-orange-500 transition-colors">Terms of Service</a>
            <a href="/refund-policy" className="hover:text-orange-500 transition-colors">Refund Policy</a>
          </div>
          <p className="text-zinc-600 text-[10px] font-mono mt-4">
            Built in India 🇮🇳 · Engineered for global scale
          </p>
        </div>
      </footer>
    </div>
  )
}