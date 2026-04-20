"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  AlertCircle, DollarSign, WifiOff, 
  Zap, Terminal, MessageSquare, Smartphone, CreditCard, Bot,
  Menu, X, ArrowRight, Check, Send, RefreshCw, Repeat, Shield, Zap as ZapIcon, Paperclip,
  ChevronDown, Activity, Lock, Eye, Brain, Cpu, Database, GitBranch,
  BarChart3, Clock, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UpgradeButton } from '@/components/dashboard/UpgradeButton'
import { MULTI_CURRENCY_PLANS, type CurrencyCode, getCurrencySymbol } from "@/lib/currency"

// ── Animated counter for stats ───────────────────────────────────────
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = Date.now()
        const tick = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.floor(eased * end))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Terminal typewriter effect ────────────────────────────────────────
function Typewriter({ lines, speed = 40 }: { lines: string[]; speed?: number }) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)

  useEffect(() => {
    if (currentLine >= lines.length) return
    const line = lines[currentLine]
    if (line.length === 0) {
      // Empty line — register it and move on
      setDisplayed(prev => { const copy = [...prev]; copy[currentLine] = ""; return copy })
      const timer = setTimeout(() => { setCurrentLine(l => l + 1); setCurrentChar(0) }, 100)
      return () => clearTimeout(timer)
    }
    if (currentChar < line.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => {
          const copy = [...prev]
          copy[currentLine] = (copy[currentLine] || "") + line[currentChar]
          return copy
        })
        setCurrentChar(c => c + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setCurrentLine(l => l + 1)
        setCurrentChar(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentLine, currentChar, lines, speed])

  return (
    <div className="font-mono text-[12px] md:text-[13px] leading-relaxed">
      {displayed.map((line, i) => (
        <div key={i} className="flex">
          <span className="text-orange-500/60 mr-3 select-none">{String(i + 1).padStart(2, '0')}</span>
          <span className={line.startsWith('#') ? 'text-zinc-600' : line.includes('@helm') ? 'text-orange-400' : line.includes('def ') || line.includes('import') ? 'text-zinc-300' : 'text-zinc-500'}>{line}</span>
        </div>
      ))}
      {currentLine < lines.length && (
        <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-7" />
      )}
    </div>
  )
}

// ── Scanning line animation ───────────────────────────────────────────
function ScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/40 to-transparent animate-[scan_4s_ease-in-out_infinite]" />
      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  )
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [currency, setCurrency] = useState<CurrencyCode>("USD")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState({
    traces: 1450000,
    agents: 4,
    members: 4,
    interventions: 18450,
    uptime: 99.99,
    sdks: 2
  })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    fetch('/api/geo').then(r => r.json()).then(data => setCurrency(data.currency)).catch(() => setCurrency("USD"))
    
    // Fetch real-time stats
    // fetch('/api/stats')
    //   .then(r => r.json())
    //   .then(data => {
    //     if (!data.error && data.traces > 1000) setStats(data)
    //   })
    //   .catch(err => console.error("Stats fetch error:", err))

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const plans = MULTI_CURRENCY_PLANS[currency]
  const symbol = getCurrencySymbol(currency)

  const pillars = [
    { icon: Shield, label: "Safety", title: "Classification-First Boundaries", desc: "Decorators that classify every tool call as @read, @side_effect, or @irreversible. The agent pauses before dangerous actions. You approve via Telegram.", color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: Eye, label: "Observability", title: "Real-Time Execution Traces", desc: "Stream step-level progress, token counts, and tool calls to your dashboard. See exactly what your agent is doing, not just what it returns.", color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: Brain, label: "Reasoning", title: "Chain-of-Thought Capture", desc: "Log the agent's internal reasoning at each step. Debug failures by reading its thought process, not guessing from outputs.", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { icon: Activity, label: "Evaluation", title: "Automated Quality Scoring", desc: "Define eval sets, run LLM-as-judge scoring, and track quality over time. Know if your agent is getting better or worse.", color: "text-red-500", bg: "bg-red-500/10" },
  ]

  const faqItems = [
    { q: "What is AgentHelm?", a: "AgentHelm is an enterprise-grade SDK and dashboard for governing AI agents in production. It provides safety boundaries, real-time observability, fault-tolerant checkpointing, and human-in-the-loop controls via Telegram." },
    { q: "How does AgentHelm differ from LangGraph or CrewAI?", a: "LangGraph and CrewAI are orchestrators — they manage agent internal logic. AgentHelm is a governance layer that wraps around any framework to provide external safety, monitoring, and remote control. They complement each other." },
    { q: "Is AgentHelm free to use?", a: "Yes. The Starter plan is free forever and includes 3 agents, 100K traces/month, and basic Telegram alerts. No credit card required." },
    { q: "What languages are supported?", a: "AgentHelm provides official SDKs for Python (pip install agenthelm-sdk) and Node.js (npm install agenthelm-node-sdk). Both use a JWT-based stateless handshake." },
    { q: "How does the fail-closed security model work?", a: "If the SDK loses connection to the AgentHelm server, it halts execution rather than continuing unsupervised. This prevents runaway agents from burning API budgets during outages." },
    { q: "Can I control agents from my phone?", a: "Yes. Connect your Telegram account and use commands like /stop, /resume, /dispatch, and /status to control your entire agent fleet from anywhere." },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
      {/* ═══ NAVBAR ═══ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 h-14 px-6 flex items-center justify-between ${
        scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800/80' : 'bg-transparent'
      }`}>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-orange-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white text-lg font-bold tracking-tight font-mono">AGENTHELM</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] font-mono uppercase tracking-wider">
          <Link href="#pillars" className="text-zinc-500 hover:text-orange-500 transition-colors">Pillars</Link>
          <Link href="#how-it-works" className="text-zinc-500 hover:text-orange-500 transition-colors">Protocol</Link>
          <Link href="#dispatch" className="text-zinc-500 hover:text-orange-500 transition-colors">Dispatch</Link>
          <Link href="#pricing" className="text-zinc-500 hover:text-orange-500 transition-colors">Pricing</Link>
          <a href="https://github.com/jayasukuv11-beep/agentdock#readme" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-orange-500 transition-colors">Docs</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-mono text-zinc-400 hover:text-white transition-colors px-3 py-1.5">LOG IN</Link>
          <Link href="/login" className="text-[13px] font-mono font-bold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 transition-colors flex items-center gap-2">
            DEPLOY <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 bg-[#0a0a0a] z-40 p-6 flex flex-col gap-6 md:hidden font-mono">
          <Link onClick={() => setMobileMenuOpen(false)} href="#pillars" className="text-lg text-zinc-300 uppercase tracking-wider">Pillars</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#how-it-works" className="text-lg text-zinc-300 uppercase tracking-wider">Protocol</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#dispatch" className="text-lg text-zinc-300 uppercase tracking-wider">Dispatch</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#pricing" className="text-lg text-zinc-300 uppercase tracking-wider">Pricing</Link>
          <div className="h-px bg-zinc-800 w-full my-2" />
          <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="text-lg text-zinc-300">Log In</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="text-lg bg-orange-500 text-white px-4 py-3 text-center font-bold">
            DEPLOY NOW
          </Link>
        </div>
      )}

      {/* ═══ HERO: COMMAND CENTER ═══ */}
      <section className="relative pt-28 pb-20 px-6 min-h-[95vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Industrial grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
        {/* Corner markers */}
        <div className="absolute top-24 left-8 w-16 h-16 border-l-2 border-t-2 border-orange-500/20 hidden md:block" />
        <div className="absolute top-24 right-8 w-16 h-16 border-r-2 border-t-2 border-orange-500/20 hidden md:block" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-orange-500/20 hidden md:block" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-orange-500/20 hidden md:block" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-orange-500/30 bg-orange-500/5 text-orange-500 text-[12px] font-mono uppercase tracking-widest mb-10">
            <div className="w-1.5 h-1.5 bg-orange-500 animate-pulse" />
            SYSTEM ONLINE — V1.0.0 STABLE
          </div>

          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] mb-6 font-mono uppercase">
            <span className="text-zinc-600 text-lg md:text-2xl block font-mono mb-4 tracking-[0.3em]">MISSION CONTROL FOR</span>
            <span className="text-white">AUTONOMOUS</span><br />
            <span className="text-orange-500 relative inline-block">
              AGENTS
              <svg className="absolute w-full h-2 -bottom-1 left-0" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 4 L200 4" stroke="#ff5722" strokeWidth="3" fill="none" strokeDasharray="8 4" />
              </svg>
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-500 mb-10 max-w-2xl mx-auto font-mono leading-relaxed">
            The governance SDK that wraps around any AI framework.<br className="hidden md:block" />
            Safety boundaries. Live traces. Telegram control.<br className="hidden md:block" />
            <span className="text-orange-500/80">Fail-closed by default.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 shadow-[0_0_60px_-15px_rgba(255,87,34,0.4)]">
              DEPLOY YOUR FIRST AGENT <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#how-it-works" className="border border-zinc-700 text-zinc-400 hover:text-white hover:border-orange-500/50 font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 bg-zinc-900/50">
              VIEW PROTOCOL <ChevronDown className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
            <span>Free tier</span>
            <span className="w-1 h-1 bg-zinc-700" />
            <span>No card required</span>
            <span className="w-1 h-1 bg-zinc-700" />
            <span>Python · Node.js</span>
          </div>
        </div>

        {/* Hero code block */}
        <div className="relative z-10 w-full max-w-xl mt-14">
          <div className="bg-[#111] border border-zinc-800 p-5 font-mono text-[13px] relative overflow-hidden">
            <ScanLine />
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/80">
              <div className="w-2.5 h-2.5 bg-orange-500" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">AGENT GOVERNANCE PROTOCOL</span>
            </div>
            <Typewriter lines={[
              "# pip install agenthelm-sdk",
              "import agenthelm as helm",
              "",
              "@helm.irreversible",
              "def drop_tables():",
              "    # Pauses. Requires Telegram approval.",
              "",
              "@helm.side_effect",
              "def charge_card(amount):",
              "    # Checkpoint created. Rollback ready.",
            ]} />
          </div>
        </div>
      </section>

      {/* ═══ THREAT BANNER ═══ */}
      <section className="py-16 px-6 bg-[#0a0a0a] border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">THREAT ASSESSMENT</span>
            <h2 className="text-2xl md:text-4xl font-black font-mono uppercase tracking-tight text-white">
              Uncontrolled agents are a <span className="text-orange-500">liability</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: AlertCircle, color: "text-red-500", bg: "border-red-500/20", title: "Silent Failures", desc: "No alerts. No notifications. Your agent stopped 6 hours ago. Silently." },
              { icon: DollarSign, color: "text-amber-500", bg: "border-amber-500/20", title: "Budget Hemorrhage", desc: "Stuck in a loop calling GPT-4. You find out when the invoice arrives." },
              { icon: WifiOff, color: "text-orange-500", bg: "border-orange-500/20", title: "Zero Remote Control", desc: "Agent stuck? SSH in, find the process, kill it. At 3 AM." },
            ].map((item, i) => (
              <div key={i} className={`bg-[#111] border ${item.bg} p-6 hover:border-zinc-600 transition-colors group`}>
                <item.icon className={`w-5 h-5 ${item.color} mb-4`} />
                <h3 className="text-base font-mono font-bold text-white mb-2 uppercase tracking-wide">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOUR PILLARS ═══ */}
      <section id="pillars" className="py-20 px-6 bg-[#0d0d0d] relative">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ff572208,transparent_40%)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">GOVERNANCE FRAMEWORK</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
              Four Pillars of <span className="text-orange-500">Control</span>
            </h2>
            <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
              Every production agent needs safety, observability, reasoning capture, and quality evaluation. AgentHelm delivers all four.
            </p>
          </div>

          {/* Pillar tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {pillars.map((p, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 font-mono text-[12px] uppercase tracking-wider transition-all border ${
                  activeTab === i 
                    ? 'bg-orange-500/10 border-orange-500/50 text-orange-500' 
                    : 'border-zinc-800 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Active pillar detail */}
          <div className="bg-[#111] border border-zinc-800 p-8 md:p-12 relative overflow-hidden">
            <ScanLine />
            <div className="flex items-start gap-6">
              <div className={`w-14 h-14 ${pillars[activeTab].bg} flex items-center justify-center shrink-0 hidden md:flex`}>
                {React.createElement(pillars[activeTab].icon, { className: `w-7 h-7 ${pillars[activeTab].color}` })}
              </div>
              <div>
                <div className="text-[10px] font-mono text-orange-500/50 uppercase tracking-widest mb-2">PILLAR {String(activeTab + 1).padStart(2, '0')}</div>
                <h3 className="text-xl md:text-2xl font-mono font-bold text-white mb-3 uppercase">{pillars[activeTab].title}</h3>
                <p className="text-zinc-400 leading-relaxed max-w-2xl">{pillars[activeTab].desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">COMPETITIVE ANALYSIS</span>
            <h2 className="text-2xl md:text-4xl font-black font-mono uppercase tracking-tight text-white mb-3">
              Orchestrator ≠ <span className="text-orange-500">Governance</span>
            </h2>
            <p className="text-zinc-500 text-sm font-mono">Frameworks like LangGraph manage internal logic. AgentHelm manages external safety.</p>
          </div>

          <div className="bg-[#111] border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-zinc-800">
              <div className="p-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Capability</div>
              <div className="p-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-l border-zinc-800">Observability (LangSmith, Helicone)</div>
              <div className="p-4 text-[10px] font-mono text-orange-500 uppercase tracking-widest border-l border-zinc-800 bg-orange-500/5">AgentHelm Governance</div>
            </div>
            {[
              ["Intervention", "Passive logging only", "1-click Telegram approval keys"],
              ["Checkpointing", "No state recovery natively", "Out-of-the-box hydration"],
              ["Budget Limits", "Requires manual alert webhooks", "Automatic fail-closed guardrails"],
              ["Safety Boundaries", "Review text after execution", "Classification-First decorators"],
              ["Failure Recovery", "Restart from scratch", "Resume from exact checkpoint"],
            ].map(([cap, orch, helm], i) => (
              <div key={i} className="grid grid-cols-3 border-b border-zinc-800/50 last:border-0">
                <div className="p-4 text-[13px] font-mono text-zinc-400">{cap}</div>
                <div className="p-4 text-[13px] text-zinc-600 border-l border-zinc-800 flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-zinc-700 shrink-0" /> {orch}
                </div>
                <div className="p-4 text-[13px] text-zinc-200 border-l border-zinc-800 bg-orange-500/[0.03] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" /> {helm}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-20 px-6 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">DEPLOYMENT PROTOCOL</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white">
              Online in <span className="text-orange-500">3 minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Authenticate", desc: "Sign up. Get your connect key instantly. No approvals, no waitlists.", code: "ahe_live_xxxxxxxxxxxxxxxx" },
              { step: "02", title: "Integrate", desc: "Install the SDK. Register your agent with one line. Works with any framework.", code: "agent = Agent(key=\"ahe_live_...\")" },
              { step: "03", title: "Govern", desc: "Open the dashboard. See live traces. Get Telegram alerts. Take control.", code: "$ helm status → ALL SYSTEMS GO" },
            ].map((item, i) => (
              <div key={i} className="bg-[#111] border border-zinc-800 p-6 hover:border-orange-500/30 transition-colors group">
                <div className="text-3xl font-mono font-black text-orange-500/20 mb-4">{item.step}</div>
                <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">{item.title}</h3>
                <p className="text-zinc-500 text-sm mb-4 leading-relaxed">{item.desc}</p>
                <div className="bg-black/50 border border-zinc-800 p-3 font-mono text-[12px] text-orange-400/80 group-hover:border-orange-500/20 transition-colors">
                  {item.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DISPATCH ═══ */}
      <section id="dispatch" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">REMOTE OPERATIONS</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-3">
              Dispatch from <span className="text-orange-500">Telegram</span>
            </h2>
            <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">Send tasks to your agents from your phone. Get structured results back instantly.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-center">
            {/* Telegram mockup */}
            <div className="bg-[#1a1d23] border border-zinc-800 overflow-hidden max-w-sm mx-auto w-full">
              <div className="bg-[#1a1d23] border-b border-zinc-800 p-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500 flex items-center justify-center text-white text-[10px] font-mono font-bold">AH</div>
                <div>
                  <div className="font-mono text-white text-sm font-bold">AgentHelm Bot</div>
                  <div className="text-[10px] text-orange-400 font-mono">ONLINE</div>
                </div>
              </div>
              <div className="p-4 space-y-3 text-[13px]">
                <div className="bg-zinc-800 p-3 max-w-[85%] text-zinc-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-red-500" />
                    <span className="font-mono font-bold text-sm">Lead Agent silent</span>
                  </div>
                  <p className="text-zinc-400 text-xs">No ping in 10m. Use <span className="text-orange-400">/resume</span> to restart.</p>
                </div>
                <div className="bg-orange-600 p-3 max-w-[85%] text-white self-end ml-auto font-mono text-sm">/resume lead-agent</div>
                <div className="bg-zinc-800 p-3 max-w-[85%] text-zinc-200 space-y-2">
                  <p className="font-mono font-bold border-b border-zinc-700 pb-2">🔄 Resuming from Checkpoint</p>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-2 text-xs">
                    <p className="text-orange-400 font-bold">Step 4: Web Search (2m ago)</p>
                    <div className="mt-2 w-full py-1.5 bg-orange-600 text-white text-center text-[10px] font-mono font-bold cursor-pointer">REPLAY FROM HERE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              {[
                { icon: Send, title: "/dispatch", desc: "Send complex tasks to any registered agent" },
                { icon: Activity, title: "/status", desc: "Get real-time progress and token counts" },
                { icon: RefreshCw, title: "/resume", desc: "Restart from the last healthy checkpoint" },
                { icon: AlertTriangle, title: "Auto-alerts", desc: "Get notified on crashes, loops, and budget spikes" },
                { icon: MessageSquare, title: "Chat", desc: "Talk directly to your running agent" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border border-zinc-800 hover:border-orange-500/20 transition-colors bg-[#111]">
                  <div className="w-10 h-10 bg-orange-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-zinc-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BANNER (E-E-A-T: Experience) ═══ */}
      <section className="py-14 px-6 bg-[#111] border-y border-zinc-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: stats.traces, suffix: "+", label: "Traces Processed" },
            { value: stats.uptime, suffix: "%", label: "Uptime SLA" },
            { value: stats.interventions, suffix: "", label: "Safety Gates" },
            { value: stats.sdks, suffix: "", label: "Official SDKs" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-2xl md:text-4xl font-mono font-black text-orange-500 mb-1">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">DEPLOYMENT TIERS</span>
            <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-3">
              Transparent <span className="text-orange-500">Pricing</span>
            </h2>
            <p className="text-zinc-500 font-mono text-sm">Start free. Scale when ready. No surprises.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-stretch mb-8">
            {/* Starter */}
            <div className="bg-[#111] border border-zinc-800 p-7 flex flex-col">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">TIER 01</div>
              <h3 className="text-lg font-mono font-bold text-white mb-1">Starter</h3>
              <div className="text-3xl font-mono font-black text-white mb-1">{symbol}0</div>
              <p className="text-zinc-600 text-[12px] font-mono mb-6 pb-6 border-b border-zinc-800">Forever free</p>
              <ul className="space-y-3 mb-6 flex-1">
                {["3 agents", "100K traces/mo", "7-day log history", "Live dashboard", "Basic Telegram alerts"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full py-3 text-center font-mono text-sm font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
                GET STARTED
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#111] border-2 border-orange-500 p-7 flex flex-col relative md:-translate-y-2 shadow-[0_0_40px_-10px_rgba(255,87,34,0.2)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-[10px] font-mono font-bold px-3 py-1 uppercase tracking-widest">RECOMMENDED</div>
              <div className="text-[10px] font-mono text-orange-500/60 uppercase tracking-widest mb-2">TIER 02</div>
              <h3 className="text-lg font-mono font-bold text-orange-500 mb-1">Pro Plan</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-mono font-black text-white">{symbol}{plans.indie.amount}</span>
                <span className="text-zinc-600 font-mono text-sm">/mo</span>
              </div>
              <p className="text-zinc-600 text-[12px] font-mono mb-6 pb-6 border-b border-zinc-800">
                {currency === 'INR' ? '≈ $19/month' : '≈ ₹1,499/month'}
              </p>
              <ul className="space-y-3 mb-6 flex-1">
                {[
                  { text: "10 agents", badge: false },
                  { text: "Telegram dispatch", badge: true },
                  { text: "2M traces/mo", badge: false },
                  { text: "30-day log history", badge: false },
                  { text: "AI failure analysis", badge: true },
                  { text: "Email + Telegram alerts", badge: false },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    {item.text}
                    {item.badge && <span className="text-[9px] font-mono bg-orange-500 text-white px-1.5 py-0.5 font-bold">NEW</span>}
                  </li>
                ))}
              </ul>
              <UpgradeButton
                plan="indie"
                label={`START FREE TRIAL — ${symbol}${plans.indie.amount}/mo`}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold py-3 text-sm shadow-lg shadow-orange-500/20"
              />
            </div>

            {/* Studio Plan */}
            <div className="bg-[#111] border border-zinc-800 p-7 flex flex-col">
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">TIER 03</div>
              <h3 className="text-lg font-mono font-bold text-white mb-1">Studio Plan</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-mono font-black text-white">{symbol}{plans.studio.amount.toLocaleString()}</span>
                <span className="text-zinc-600 font-mono text-sm">/mo</span>
              </div>
              <p className="text-zinc-600 text-[12px] font-mono mb-6 pb-6 border-b border-zinc-800">
                {currency === 'INR' ? '≈ $99/month' : '≈ ₹8,499/month'}
              </p>
              <ul className="space-y-3 mb-6 flex-1">
                {["Unlimited agents", "Unlimited dispatch", "15M traces/mo", "Everything in Indie", "Team support", "Priority support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <UpgradeButton
                plan="studio"
                label={`START FREE TRIAL — ${symbol}${plans.studio.amount}/mo`}
                className="w-full bg-zinc-800 hover:bg-orange-500 text-zinc-300 hover:text-white font-mono font-bold py-3 text-sm transition-colors"
              />
            </div>
          </div>
          <p className="text-center text-zinc-600 text-[12px] font-mono">All plans include a 14-day Indie trial · No credit card required</p>
        </div>
      </section>

      {/* ═══ FAQ (E-E-A-T: Expertise + GEO) ═══ */}
      <section id="faq" className="py-20 px-6 bg-[#0d0d0d] border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">KNOWLEDGE BASE</span>
            <h2 className="text-2xl md:text-4xl font-black font-mono uppercase tracking-tight text-white">
              Frequently Asked <span className="text-orange-500">Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details key={i} className="group bg-[#111] border border-zinc-800 hover:border-zinc-700 transition-colors">
                <summary className="p-5 cursor-pointer flex items-center justify-between font-mono text-sm text-white font-bold list-none">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-zinc-600 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* JSON-LD FAQ Schema for SEO/GEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqItems.map(item => ({
                "@type": "Question",
                "name": item.q,
                "acceptedAnswer": { "@type": "Answer", "text": item.a }
              }))
            })
          }}
        />
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-orange-950/50 to-[#111] border border-orange-500/30 p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/10 blur-3xl" />
          
          <h2 className="text-3xl md:text-5xl font-mono font-black text-white mb-4 relative z-10 uppercase tracking-tight">
            Ready to take <span className="text-orange-500">the helm</span>?
          </h2>
          <p className="text-zinc-400 font-mono text-sm mb-8 relative z-10">
            Your agents deserve mission control. Deploy in minutes. Free forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
            <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center gap-2 shadow-[0_0_40px_-10px_rgba(255,87,34,0.4)]">
              DEPLOY NOW <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#pillars" className="border border-zinc-700 text-zinc-400 hover:text-white font-mono text-sm px-8 py-4 transition-all bg-zinc-900/50">
              EXPLORE PILLARS
            </Link>
          </div>
          <p className="mt-6 text-zinc-600 text-[11px] font-mono relative z-10 uppercase tracking-widest">
            No credit card · Free forever · Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══ FOOTER (E-E-A-T: Trustworthiness) ═══ */}
      <footer className="bg-[#0a0a0a] border-t border-zinc-800 pt-12 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-orange-500 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-white text-base font-bold font-mono tracking-tight">AGENTHELM</span>
              </Link>
              <p className="text-zinc-600 text-xs font-mono leading-relaxed max-w-[260px]">
                The industrial standard for AI agent governance. Built for developers. Free to start.
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-zinc-500 font-mono">
                <li><Link href="#pillars" className="hover:text-orange-500 transition-colors">Pillars</Link></li>
                <li><Link href="#how-it-works" className="hover:text-orange-500 transition-colors">Protocol</Link></li>
                <li><Link href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</Link></li>
                <li><Link href="#dispatch" className="hover:text-orange-500 transition-colors">Dispatch</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-zinc-500 font-mono">
                <li><a href="https://pypi.org/project/agenthelm-sdk" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Python SDK</a></li>
                <li><a href="https://www.npmjs.com/package/agenthelm-node-sdk" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Node.js SDK</a></li>
                <li><a href="https://github.com/jayasukuv11-beep/agenthelm" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-zinc-500 font-mono">
                <li><Link href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
                <li><Link href="/refund-policy" className="hover:text-orange-500 transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-zinc-500 font-mono">
                <li><a href="mailto:tharagesharumugam@gmail.com" className="hover:text-orange-500 transition-colors">tharagesharumugam@gmail.com</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-700">
            <p>© {new Date().getFullYear()} AgentHelm · The AgentHelm Research Team</p>
            <p>Built in India 🇮🇳 · Engineered for global scale</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
