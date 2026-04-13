"use client"

import React from "react"
import Link from "next/link"
import { Shield, ArrowLeft } from "lucide-react"

interface LegalPageProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-orange-500 selection:text-white">
      {/* ── Background Grid ────────────────────────────────────────── */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      
      {/* ── Fixed Header ────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800/80 h-14 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-orange-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white text-md font-bold tracking-tight font-mono">AGENTHELM</span>
        </Link>

        <Link href="/" className="text-[12px] font-mono text-zinc-500 hover:text-orange-500 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-3 h-3" /> BACK TO COMMAND CENTER
        </Link>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="relative pt-32 pb-24 px-6 max-w-3xl mx-auto z-10">
        <div className="mb-12 border-l-2 border-orange-500 pl-6">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase font-mono mb-4">
            {title}
          </h1>
          <p className="text-orange-500/60 font-mono text-sm uppercase tracking-widest">
            Protocol Effective: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-invert max-w-none 
          prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-zinc-100
          prose-p:text-zinc-400 prose-p:leading-relaxed
          prose-strong:text-orange-500 prose-strong:font-bold
          prose-ul:list-square prose-li:marker:text-orange-500/40
          space-y-8 text-[15px]">
          {children}
        </div>

        {/* ── Footer Decoration ───────────────────────────────────────── */}
        <div className="mt-20 pt-10 border-t border-zinc-900 flex flex-col items-center gap-4">
          <div className="w-2 h-2 bg-orange-500 animate-pulse" />
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
            Agent Governance Protocol — Secure Access Guaranteed
          </p>
        </div>
      </main>
    </div>
  )
}
