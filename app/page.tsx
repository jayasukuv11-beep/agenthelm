"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  AlertCircle, DollarSign, WifiOff, 
  Zap, Terminal, MessageSquare, Smartphone, CreditCard, Bot,
  Menu, X, ArrowRight, Check, Send, RefreshCw, Repeat, Shield, Zap as ZapIcon, Paperclip
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-[#10b981] selection:text-white">
      {/* SECTION 1: NAVBAR */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-200 h-16 px-6 flex items-center justify-between ${
          scrolled ? 'bg-[#09090b]/80 backdrop-blur-md border-b border-gray-800' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <span className="text-emerald-500 text-xl font-bold mr-2 group-hover:animate-pulse">⚡</span>
            <span className="text-white text-xl font-bold tracking-tight">AgentHelm</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
          <Link href="#dispatch" className="text-gray-400 hover:text-white transition-colors">Dispatch</Link>
          <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How it Works</Link>
          <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="#" className="text-gray-400 hover:text-white transition-colors">Docs</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Log In
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <button 
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-[#09090b] z-40 p-6 flex flex-col gap-6 md:hidden">
          <Link onClick={() => setMobileMenuOpen(false)} href="#features" className="text-lg font-medium text-gray-300">Features</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#dispatch" className="text-lg font-medium text-gray-300">Dispatch</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#how-it-works" className="text-lg font-medium text-gray-300">How it Works</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#pricing" className="text-lg font-medium text-gray-300">Pricing</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="#" className="text-lg font-medium text-gray-300">Docs</Link>
          <div className="h-px bg-gray-800 w-full my-2"></div>
          <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="text-lg font-medium text-gray-300">Log In</Link>
          <Link onClick={() => setMobileMenuOpen(false)} href="/login" className="text-lg font-medium bg-emerald-500 text-white px-4 py-3 rounded-lg text-center">
            Get Started Free
          </Link>
        </div>
      )}

      {/* SECTION 2: HERO */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" /> ⚡ Dispatch · Monitor · Control · Free to Start
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Take the <span className="text-emerald-500 relative">
              Helm
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-500/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span><br className="hidden md:block" /> of Your AI Agents
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Add one line. Dispatch tasks to your agents from your phone. Monitor logs, track tokens, get instant alerts, and control every agent from Telegram — even when your laptop is off.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto">
            <Link href="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-lg px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
              Take the Helm — Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works" className="border border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500 font-medium text-lg px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 bg-[#111]">
              See How It Works <ArrowRight className="w-5 h-5 rotate-90" />
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-16 text-sm text-gray-500">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=dev${i}`} alt="user" className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-gray-800" />
              ))}
            </div>
            <p>500+ developers monitoring their agents</p>
          </div>

          <div className="w-full max-w-[560px] text-left">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 md:p-6 font-mono text-[13px] md:text-sm shadow-2xl overflow-x-auto relative group">
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <pre className="text-zinc-300">
                <code className="block">
                  <span className="text-zinc-500"># Install</span><br/>
                  <span className="text-zinc-100">pip install agenthelm-sdk</span><br/><br/>
                  
                  <span className="text-zinc-500"># Connect & listen for tasks</span><br/>
                  <span className="text-emerald-400">from</span> agenthelm <span className="text-emerald-400">import</span> Agent<br/><br/>

                  agent = Agent(key=<span className="text-emerald-300">"ahe_live_..."</span>)<br/>
                  
                  <span className="text-blue-400">@agent.on_dispatch</span><br/>
                  <span className="text-emerald-400">def</span> <span className="text-blue-400">handle_task</span>(task, data):<br/>
                  &nbsp;&nbsp;agent.log(<span className="text-emerald-300">f"Dispatch received: {"{task}"}"</span>)<br/>
                  &nbsp;&nbsp;agent.progress(<span className="text-zinc-400">25</span>, <span className="text-emerald-300">"Searching..."</span>)<br/>
                  &nbsp;&nbsp;agent.track_tokens(<span className="text-zinc-400">500</span>, <span className="text-emerald-300">"gpt-4o"</span>)<br/>
                  &nbsp;&nbsp;<span className="text-emerald-400">return</span> {"{"}<span className="text-emerald-300">"url"</span>: <span className="text-emerald-300">"leads.csv"</span>{"}"}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PROBLEM */}
      <section id="features" className="py-16 md:py-24 px-6 bg-[#09090b]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Running AI agents is a black box</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              You built it. You deployed it. Now you have no idea what it's doing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Did it crash?</h3>
              <p className="text-gray-500 leading-relaxed">
                No alerts. No notifications. You wake up to find your agent stopped 6 hours ago. Silently.
              </p>
            </div>
            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
                <DollarSign className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">How much did it cost?</h3>
              <p className="text-gray-400 leading-relaxed">
                LLM tokens add up fast. No way to see real-time usage until you get the invoice.
              </p>
            </div>
            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                <WifiOff className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Can you control it remotely?</h3>
              <p className="text-gray-500 leading-relaxed">
                Agent stuck in a loop? You need to SSH in, find the process, and kill it manually.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: COMPARISON BANNER */}
      <section className="py-24 px-6 border-y border-zinc-900 bg-black overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="border-red-500/50 text-red-400 px-3 py-1 rounded-full bg-red-500/5 animate-pulse">
              vs Claude Dispatch
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              The Open Alternative to <br/>
              <span className="text-zinc-500">Claude Dispatch</span>
            </h2>
            <div className="space-y-4 text-zinc-400 text-lg">
              <p>Claude is powerful but expensive and locked to one provider. It requires your Mac to be awake and is limited to specific use cases.</p>
              <p>AgentHelm Dispatch works with <strong className="text-emerald-400">any agent</strong>, on any server, using any LLM provider. Control your agents from Telegram while your laptop is closed at the beach.</p>
            </div>
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm overflow-hidden shadow-2xl">
            <div className="grid grid-cols-2 border-b border-zinc-800">
              <div className="p-4 text-center text-zinc-500 font-medium">Claude Dispatch</div>
              <div className="p-4 text-center bg-emerald-500/10 text-emerald-400 font-bold border-l border-zinc-800">AgentHelm</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {[
                ["Costs", "$20/mo + Usage", "Free to Start"],
                ["Lock-in", "Claude Only", "Any LLM (Open Source)"],
                ["Availability", "Mac must be awake", "Cloud-native (Always on)"],
                ["Interface", "Desktop Only", "Telegram + Dashboard"],
                ["Control", "Auto-only", "Remote CLI + Manual Overrides"]
              ].map(([feature, claude, helm], i) => (
                <div key={i} className="grid grid-cols-2 text-sm">
                  <div className="p-4 text-zinc-400 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">{feature}</span>
                    <span>{claude}</span>
                  </div>
                  <div className="p-4 bg-emerald-500/5 text-zinc-200 border-l border-zinc-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{helm}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION 4: SOLUTION - FEATURES */}
      <section className="py-24 px-6 bg-[#0d0d0d] border-y border-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Meet AgentHelm</h2>
            <p className="text-xl font-medium text-emerald-500 mb-4">Your AI Agent Control Plane</p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Add one line of code. Take full control of every agent you build.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#111] border-2 border-emerald-500/50 rounded-xl p-8 relative overflow-hidden group hover:border-emerald-500 transition-all hover:scale-[1.02] shadow-emerald-500/5 hover:shadow-emerald-500/10 shadow-xl">
              <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">New</div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Send className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dispatch Tasks Remotely</h3>
              <p className="text-gray-400 leading-relaxed">
                Send tasks to your agents from Telegram. "/dispatch lead-agent find 10 leads". Work continues without your laptop.
              </p>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 hover:border-emerald-500/30 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <RefreshCw className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Progress</h3>
              <p className="text-gray-400 leading-relaxed">
                See circular progress bars and status updates on your phone. "Agent is 45% done researching competitor pricing."
              </p>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-xl p-8 hover:border-emerald-500/30 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Repeat className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Loop Automation</h3>
              <p className="text-gray-400 leading-relaxed">
                Auto-restart agents if they crash or get stuck. Set up infinite loops for long-running data gathering tasks.
              </p>
            </div>

            <div className="bg-[#111] border border-zinc-800 rounded-xl p-8 hover:border-emerald-500/50 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Terminal className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Log Terminal</h3>
              <p className="text-gray-400 leading-relaxed">
                Stream real-time logs with color coding, filtering, and search. See exactly what your agent is doing right now.
              </p>
            </div>

            <div className="bg-[#111] border border-zinc-800 rounded-xl p-8 hover:border-emerald-500/50 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Chat With Agents</h3>
              <p className="text-gray-400 leading-relaxed">
                Send commands. Get responses. Chat directly with your running agent from dashboard or Telegram.
              </p>
            </div>

            <div className="bg-[#111] border border-zinc-800 rounded-xl p-8 hover:border-emerald-500/50 transition-all hover:scale-[1.02] group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Bot className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Failure Analysis</h3>
              <p className="text-gray-400 leading-relaxed">
                Click Explain on any error. Gemini reads your logs and tells you exactly what went wrong and how to fix it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-[#09090b]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Up and running in 3 minutes</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start relative">
            {/* Arrows for desktop */}
            <div className="hidden md:block absolute top-12 left-[30%] text-emerald-500/30">
              <ArrowRight className="w-8 h-8" />
            </div>
            <div className="hidden md:block absolute top-12 left-[64%] text-emerald-500/30">
              <ArrowRight className="w-8 h-8" />
            </div>

            <div className="flex-1 w-full bg-[#111] border border-gray-800 rounded-xl p-6 md:p-8 hover:border-gray-700 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mb-6 text-sm">1</div>
              <h3 className="text-xl font-bold text-white mb-3">Sign up and get key</h3>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                Create a free account. Your unique connect key is generated instantly.
              </p>
              <div className="bg-black/50 border border-gray-800 p-4 rounded-lg font-mono text-[13px] text-green-400 break-all select-all">
                ahe_live_xxxxxxxxxxxxxxxx
              </div>
            </div>

            <div className="flex-1 w-full bg-[#111] border border-gray-800 rounded-xl p-6 md:p-8 hover:border-gray-700 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mb-6 text-sm">2</div>
              <h3 className="text-xl font-bold text-white mb-3">Add one line</h3>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                Install the SDK and connect. Works with any Python or Node.js agent.
              </p>
              <div className="bg-black/50 border border-gray-800 p-4 rounded-lg font-mono text-[13px] text-gray-300 break-all overflow-hidden space-y-2">
                <div><span className="text-gray-500"># Terminal</span><br/>pip install agenthelm-sdk</div>
                <div className="pt-2"><span className="text-gray-500"># Code</span><br/>helm = agenthelm.connect(<span className="text-green-400">"..."</span>)</div>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#111] border border-gray-800 rounded-xl p-6 md:p-8 hover:border-gray-700 transition-colors group">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mb-6 text-sm">3</div>
              <h3 className="text-xl font-bold text-white mb-3">Take the helm</h3>
              <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                Open the dashboard. See your agent live. Chat with it. Get Telegram alerts.
              </p>
              <div className="bg-black/50 border border-gray-800 p-3 rounded-lg overflow-hidden flex flex-col gap-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-white uppercase font-bold tracking-wider">Dashboard</span>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 h-3 bg-gray-800 rounded-sm"></div>
                  <div className="flex-1 h-5 bg-emerald-500/40 rounded-sm"></div>
                  <div className="flex-1 h-2 bg-gray-800 rounded-sm"></div>
                  <div className="flex-1 h-6 bg-emerald-500/70 rounded-sm"></div>
                  <div className="flex-1 h-4 bg-gray-800 rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: DISPATCH FLOW */}
      <section id="dispatch" className="py-24 px-6 bg-[#09090b] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
              📨 New Feature
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              Dispatch Tasks From Your Phone
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Your agents don't need a browser to be productive. Send complex tasks via Telegram and watch them execute in real-time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="space-y-6">
              <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center gap-4 group hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">AH</div>
                  <div className="bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2 text-xs text-zinc-200">
                    Ready for dispatch.
                  </div>
                </div>
                <div className="bg-emerald-600 rounded-2xl rounded-tr-none px-4 py-2 text-xs text-white self-end flex items-center gap-2">
                  <span>/dispatch lead-agent find 20 leads</span>
                  <Send className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-500">01.</span> Send from Telegram
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Start any registered agent task with a simple command. No SSH, no dashboard login required.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-6">
              <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center overflow-hidden font-mono text-[10px] group hover:border-emerald-500/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-blue-400">@agent.on_dispatch</p>
                  <p className="text-emerald-400">def <span className="text-blue-300">handle_task</span>(task, data):</p>
                  <p className="text-zinc-500 ml-4"># Business logic here</p>
                  <p className="text-zinc-300 ml-4">results = <span className="text-blue-300">search_leads</span>(task)</p>
                  <p className="text-emerald-400 ml-4">return <span className="text-zinc-300">results</span></p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-500">02.</span> Agent runs code
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  The `@on_dispatch` decorator triggers your function automatically wherever the agent is running.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-6">
              <div className="aspect-[4/3] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center gap-4 group hover:border-emerald-500/50 transition-colors">
                <div className="bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2 text-xs text-zinc-200 space-y-2">
                  <p className="font-bold text-emerald-400">Task Complete! ✅</p>
                  <p>Found 20 leads for "SaaS marketing".</p>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 border-t border-zinc-700 pt-2 mt-2">
                    <Paperclip className="w-3 h-3" />
                    <span>leads_export.csv (4.2kb)</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-500">03.</span> Get results instantly
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Structured data, files, and success logs are sent back to your Telegram thread immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: TELEGRAM FEATURE HIGHLIGHT */}
      <section className="py-24 px-6 bg-[linear-gradient(135deg,#064e3b22,#09090b)] border-y border-gray-800 overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[13px] font-bold mb-6">
              <Smartphone className="w-4 h-4" /> Telegram Integration
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">Your entire agent fleet, inside Telegram</h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Connect your Telegram account and get instant alerts when agents crash, spike in tokens, or go silent. Control everything without opening a browser.
            </p>
            <ul className="space-y-4">
              {[
                "Instant crash alerts",
                "/stop and /run commands",
                "Daily usage summaries",
                "Token spike warnings",
                "Chat with agents in Telegram"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[320px] md:max-w-full">
            {/* Phone Mockup Frame */}
            <div className="bg-[#1f2937] border-4 border-gray-900 rounded-[2rem] shadow-2xl overflow-hidden aspect-[9/18] md:aspect-auto md:h-[500px] flex flex-col relative w-full pb-4">
              {/* Header */}
              <div className="bg-[#1f2937] border-b border-gray-800 p-4 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">AH</div>
                  <div>
                    <div className="font-bold text-white text-sm">AgentHelm Bot</div>
                    <div className="text-xs text-blue-300">bot</div>
                  </div>
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto font-sans text-[13px]">
                {/* Bot Alert */}
                <div className="bg-[#2a3646] rounded-xl rounded-tl-sm p-3 max-w-[85%] text-gray-200 shadow-sm border border-gray-700 w-fit">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="font-bold">Lead Agent has gone silent</span>
                  </div>
                  <p className="mb-2 text-gray-300">No ping received in 10 minutes.</p>
                  <p className="text-gray-400 text-xs">Use <span className="text-blue-400">/run Lead Agent</span> to restart.</p>
                </div>

                {/* User Message */}
                <div className="bg-[#10b981] rounded-xl rounded-tr-sm p-3 max-w-[85%] text-white self-end shadow-sm w-fit">
                  /agents
                </div>

                {/* Bot Reply */}
                <div className="bg-[#2a3646] rounded-xl rounded-tl-sm p-3 max-w-[85%] text-gray-200 shadow-sm border border-gray-700 w-fit">
                  <p className="font-bold mb-3 border-b border-gray-700 pb-2">🤖 Your Agents (3)</p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px]">🟢</span> <span className="font-bold">Lead Agent</span>
                      </div>
                      <div className="text-gray-400 text-xs ml-5 mt-1">Status: running</div>
                      <div className="text-gray-400 text-xs ml-5">Last ping: 5s ago</div>
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px]">🔴</span> <span className="font-bold">Email Bot</span>
                      </div>
                      <div className="text-gray-400 text-xs ml-5 mt-1">Status: stopped</div>
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px]">🟡</span> <span className="font-bold">Data Scraper</span>
                      </div>
                      <div className="text-gray-400 text-xs ml-5 mt-1">Status: idle</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute -z-10 bg-emerald-500/20 w-64 h-64 blur-3xl rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PRICING */}
      <section id="pricing" className="py-24 px-6 bg-[#09090b]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Simple, honest pricing</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Start free. Upgrade when you're ready. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto mb-10">
            {/* Free Tier */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 flex flex-col text-left">
              <h3 className="text-xl font-medium text-white mb-1">Starter</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">₹0</span>
              </div>
              <p className="text-gray-500 text-sm mb-8 pb-8 border-b border-gray-800">Forever free</p>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  { text: '3 agents', icon: Check, color: 'text-gray-300' },
                  { text: '100,000 traces/month', icon: Check, color: 'text-gray-300' },
                  { text: '7 day log history', icon: Check, color: 'text-gray-300' },
                  { text: 'Live dashboard', icon: Check, color: 'text-gray-300' },
                  { text: 'Telegram alerts (basic)', icon: Check, color: 'text-gray-300' },
                  { text: 'AI failure analysis', icon: X, color: 'text-gray-600' },
                  { text: 'All anomaly alerts', icon: X, color: 'text-gray-600' },
                ].map((item, i) => (
                  <li key={i} className={`flex items-start gap-3 ${item.color}`}>
                    <item.icon className="w-5 h-5 shrink-0 opacity-80" />
                    <span className="text-sm">{item.text}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="w-full py-4 rounded-xl font-bold text-center bg-[#1f2937] text-white hover:bg-gray-700 transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Indie Tier */}
            <div className="bg-[#111] border-2 border-emerald-500 rounded-2xl p-8 flex flex-col text-left relative transform md:-translate-y-4 shadow-2xl shadow-emerald-500/10 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-medium text-emerald-400 mb-1">Indie</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">₹399</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-500 text-sm mb-8 pb-8 border-b border-gray-800">~$5/month</p>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  { text: '10 agents', icon: Check, color: 'text-white font-medium' },
                  { text: 'Dispatch tasks', icon: ZapIcon, color: 'text-emerald-400 font-bold', badge: 'NEW' },
                  { text: 'Progress tracking', icon: RefreshCw, color: 'text-emerald-400 font-bold', badge: 'NEW' },
                  { text: '2,000,000 traces/month', icon: Check, color: 'text-zinc-200' },
                  { text: '30 day log history', icon: Check, color: 'text-zinc-200' },
                  { text: 'AI failure explanations', icon: Check, color: 'text-emerald-400 font-medium' },
                  { text: 'Email + Telegram alerts', icon: Check, color: 'text-zinc-200' },
                ].map((item, i) => (
                  <li key={i} className={`flex items-start gap-3 ${item.color}`}>
                    <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.text}</span>
                      {item.badge && <Badge className="bg-emerald-500 text-white text-[8px] h-4 px-1 leading-none">{item.badge}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="w-full py-4 rounded-xl font-bold text-center bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
                Start Free Trial
              </Link>
            </div>

            {/* Studio Tier */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 flex flex-col text-left">
              <h3 className="text-xl font-medium text-white mb-1">Studio</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">₹1,299</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-500 text-sm mb-8 pb-8 border-b border-gray-800">~$16/month</p>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  { text: 'Unlimited agents', icon: Check, color: 'text-white' },
                  { text: 'Unlimited dispatch', icon: ZapIcon, color: 'text-emerald-400 font-bold', badge: 'NEW' },
                  { text: '15,000,000 traces/month', icon: Check, color: 'text-white' },
                  { text: 'Everything in Indie', icon: Check, color: 'text-white' },
                  { text: 'Task history', icon: Repeat, color: 'text-white' },
                  { text: 'Team support', icon: Shield, color: 'text-white' },
                  { text: 'Priority support', icon: Check, color: 'text-white' },
                ].map((item, i) => (
                  <li key={i} className={`flex items-start gap-3 ${item.color}`}>
                    <item.icon className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                    <div className="flex items-center gap-2">
                       <span className="text-sm">{item.text}</span>
                       {item.badge && <Badge className="bg-emerald-500 text-white text-[8px] h-4 px-1 leading-none">{item.badge}</Badge>}
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="w-full py-4 rounded-xl font-bold text-center bg-transparent border border-gray-700 text-white hover:bg-gray-800 transition-colors">
                Start Free Trial
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm max-w-lg mx-auto">
            🎉 All plans include a 14-day Indie trial. No credit card required.
          </p>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="px-6 py-12 md:py-24 max-w-6xl mx-auto">
        <div className="bg-[linear-gradient(135deg,#064e3b,#065f46)] rounded-[2rem] p-10 md:p-20 text-center border border-emerald-500/50 shadow-2xl flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/30 blur-3xl rounded-full"></div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 relative z-10 tracking-tight">Ready to dispatch your first task?</h2>
          <p className="text-emerald-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
            Join 500+ developers who monitor and dispatch their AI agents with AgentHelm. Free to start. Live in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <Link href="/login" className="bg-white hover:bg-gray-100 text-[#064e3b] font-bold text-lg px-8 py-4 rounded-xl transition-transform active:scale-95 shadow-xl flex items-center gap-2">
              Get Started — Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#dispatch" className="bg-emerald-500/20 hover:bg-emerald-500/30 text-white border border-emerald-500/50 font-bold text-lg px-8 py-4 rounded-xl transition-transform active:scale-95 shadow-xl flex items-center gap-2">
              See Dispatch <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-6 text-emerald-200/80 text-sm relative z-10">
            No credit card · Free forever · Cancel anytime
          </p>
        </div>
      </section>

      {/* SECTION 9: FOOTER */}
      <footer className="bg-[#09090b] border-t border-gray-800 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <span className="text-emerald-500 text-xl font-bold">⚡</span>
                <span className="text-white text-xl font-bold tracking-tight">AgentHelm</span>
              </Link>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-[280px]">
                The control plane for AI agents.<br/>Built for developers. Free to start.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">GH</a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">TW</a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">DV</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-emerald-400 transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
                <li><Link href="/changelog" className="hover:text-emerald-400 transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Python SDK</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Node.js SDK</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">API Reference</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:support@agenthelm.dev" className="hover:text-emerald-400 transition-colors">support@agenthelm.dev</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} AgentHelm · Built for developers</p>
            <p>AgentHelm is proudly built in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
