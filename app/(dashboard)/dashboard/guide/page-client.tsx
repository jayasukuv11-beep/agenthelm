"use client";

import { 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  MessageSquare, 
  RefreshCcw, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Globe,
  Bot
} from "lucide-react";

export default function GuidePage() {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-none bg-[#111] border border-zinc-800 p-8 md:p-12 mb-12">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black font-mono uppercase tracking-tight mb-4 text-white">
            Everything you need <br />to secure your agents.
          </h1>
          <p className="text-lg font-mono text-zinc-500">
            AgentHelm is a production-grade safety platform for AI Agents. 
            Monitor state in real-time, enforce human-in-the-loop safety boundaries, 
            and recover from failures with absolute integrity.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-500/5 blur-3xl opacity-50" />
      </div>

      {/* Quick Start Card */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-none">
            <Rocket className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-[16px] font-mono font-bold tracking-widest text-white uppercase">Quick Start (SDK)</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#111] border border-zinc-800 rounded-none p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-orange-500">Python SDK v0.3.0</span>
              <Code2 className="w-4 h-4 text-zinc-500" />
            </div>
            <code className="block bg-[#0a0a0a] p-4 rounded-none border border-zinc-800 text-[13px] text-zinc-300 font-mono">
              pip install agenthelm-sdk
            </code>
            <div className="space-y-2 text-[12px] font-mono text-zinc-500 uppercase tracking-wider">
              <p>• Optimized Hybrid Sync model</p>
              <p>• Built-in SHA256 state integrity</p>
              <p>• Native "Fail-Closed" tool decorators</p>
            </div>
          </div>

          <div className="bg-[#111] border border-zinc-800 rounded-none p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-orange-500">Node.js SDK v0.4.0</span>
              <Code2 className="w-4 h-4 text-zinc-500" />
            </div>
            <code className="block bg-[#0a0a0a] p-4 rounded-none border border-zinc-800 text-[13px] text-zinc-300 font-mono">
              npm install agenthelm-node-sdk
            </code>
            <div className="space-y-2 text-[12px] font-mono text-zinc-500 uppercase tracking-wider">
              <p>• Full TypeScript support</p>
              <p>• Low-latency checkpointing</p>
              <p>• Real-time log streaming</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Firewall Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-none">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-[16px] font-mono font-bold tracking-widest text-white uppercase">Safety Firewall (Fail-Closed)</h2>
        </div>
        
        <div className="bg-[#111] border border-zinc-800 rounded-none p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 border border-orange-500/30 bg-orange-500/10 rounded-none flex items-center justify-center">
                <span className="text-[12px] font-mono font-bold text-orange-500">1</span>
              </div>
              <h3 className="font-mono text-[13px] font-bold text-white uppercase tracking-wider">Classification</h3>
              <p className="text-[12px] font-mono text-zinc-500 uppercase tracking-wider">Categorize tool calls as Read-only, Side Effect, or Irreversible.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 border border-orange-500/30 bg-orange-500/10 rounded-none flex items-center justify-center">
                <span className="text-[12px] font-mono font-bold text-orange-500">2</span>
              </div>
              <h3 className="font-mono text-[13px] font-bold text-white uppercase tracking-wider">Intervention Gating</h3>
              <p className="text-[12px] font-mono text-zinc-500 uppercase tracking-wider">Irreversible actions are held in a pending state until approved by you via Dashboard or Telegram.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 border border-orange-500/30 bg-orange-500/10 rounded-none flex items-center justify-center">
                <span className="text-[12px] font-mono font-bold text-orange-500">3</span>
              </div>
              <h3 className="font-mono text-[13px] font-bold text-white uppercase tracking-wider">60s Auto-Reject</h3>
              <p className="text-[12px] font-mono text-zinc-500 uppercase tracking-wider">If no approval is received within 60 seconds, the tool call is automatically rejected to prevent "zombie" actions.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 border border-orange-500/30 bg-orange-500/10 rounded-none flex items-center justify-center">
                <span className="text-[12px] font-mono font-bold text-orange-500">4</span>
              </div>
              <h3 className="font-mono text-[13px] font-bold text-white uppercase tracking-wider">Fail-Closed Mode</h3>
              <p className="text-[12px] font-mono text-zinc-500 uppercase tracking-wider">Initialize the SDK with fail_closed=True to strictly halt your agent if it loses connection to the governance server.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram Command Guide */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-none">
            <MessageSquare className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-[16px] font-mono font-bold tracking-widest text-white uppercase">Telegram Remote Control</h2>
        </div>

        <div className="border border-zinc-800 bg-[#111] overflow-hidden rounded-none">
          <table className="w-full text-left font-mono text-[12px] uppercase">
            <thead className="bg-[#0a0a0a] text-zinc-500 border-b border-zinc-800 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Command</th>
                <th className="px-6 py-4 font-bold text-center">Icon</th>
                <th className="px-6 py-4 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-400 tracking-wider">
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">/status</td>
                <td className="px-6 py-4 text-center">📊</td>
                <td className="px-6 py-4">See current agent progress, token usage, and last checkpoint.</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">/logs</td>
                <td className="px-6 py-4 text-center">📋</td>
                <td className="px-6 py-4">View the last 5 logs from your active agent session.</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">/run [name]</td>
                <td className="px-6 py-4 text-center">▶️</td>
                <td className="px-6 py-4">Start a specific agent or launch your primary stack.</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">/stop [name]</td>
                <td className="px-6 py-4 text-center">🛑</td>
                <td className="px-6 py-4">Safely stop an agent via a "Confirm Stop" interactive button.</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">/resume</td>
                <td className="px-6 py-4 text-center">🚀</td>
                <td className="px-6 py-4">Restart a task from the last valid checkpoint using SHA256 validation.</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">/credits</td>
                <td className="px-6 py-4 text-center">💳</td>
                <td className="px-6 py-4">Check your monthly token limits and current consumption.</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors">
                <td className="px-6 py-4 font-bold text-orange-500">Intl Keyboards</td>
                <td className="px-6 py-4 text-center">✅</td>
                <td className="px-6 py-4">Receive Telegram alerts for irreversible actions with one-tap Approve/Reject buttons.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* New Infrastructure Features */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-zinc-800 rounded-none p-8 space-y-4 hover:border-zinc-700 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-orange-500" />
            <h3 className="text-[14px] font-mono font-bold tracking-wider text-white uppercase">Multi-Currency Billing</h3>
          </div>
          <p className="text-zinc-500 font-mono text-[12px] uppercase leading-relaxed tracking-wider">
            Credits and subscription costs are now dynamically localized based on your region. 
            Indian users see <code className="text-orange-400">INR (₹)</code> while international 
            users use <code className="text-orange-400">USD ($)</code>.
          </p>
        </div>

        <div className="bg-[#111] border border-zinc-800 rounded-none p-8 space-y-4 hover:border-zinc-700 transition-colors shadow-sm">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-orange-500" />
            <h3 className="text-[14px] font-mono font-bold tracking-wider text-white uppercase">AI-Ready Protocol</h3>
          </div>
          <p className="text-zinc-500 font-mono text-[12px] uppercase leading-relaxed tracking-wider">
            The platform is now machine-readable via <code className="text-orange-400">llms.txt</code>. 
            Optimized for AI coding assistants like Cursor and Windsurf to instantly 
            understand your secure agent architecture.
          </p>
        </div>

        <div className="bg-[#111] border border-zinc-800 rounded-none p-8 space-y-4 hover:border-zinc-700 transition-colors shadow-sm md:col-span-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-orange-500" />
            <h3 className="text-[14px] font-mono font-bold tracking-wider text-white uppercase">Evaluation Pipeline (LLM-as-a-Judge)</h3>
          </div>
          <p className="text-zinc-500 font-mono text-[12px] uppercase leading-relaxed tracking-wider">
            AgentHelm now features a full, trace-connected Eval engine powered by <code className="text-orange-400">Gemini 2.5 Flash</code>. 
            Define rubrics (e.g. "Politeness", "No leaked secrets") and fire SDK triggers. The system autonomously scores outputs 0.0 to 1.0, 
            tracking regression metrics natively on the dashboard!
          </p>
        </div>
      </section>

      {/* Persistence & Integrity */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-zinc-800 rounded-none p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-5 h-5 text-orange-500" />
            <h3 className="text-[14px] font-mono font-bold tracking-wider text-white uppercase">Integrity Hashing</h3>
          </div>
          <p className="text-zinc-500 font-mono text-[12px] uppercase leading-relaxed tracking-wider">
            Every checkpoint includes a <code className="text-orange-400">state_hash</code> (SHA256). 
            When resuming, AgentHelm verifies the hash to ensure the state hasn't 
            been corrupted or tampered with during downtime.
          </p>
        </div>

        <div className="bg-[#111] border border-zinc-800 rounded-none p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="text-[14px] font-mono font-bold tracking-wider text-white uppercase">Hybrid Sync</h3>
          </div>
          <p className="text-zinc-500 font-mono text-[12px] uppercase leading-relaxed tracking-wider">
            Non-critical telemetry (logs, output, progress) is synced asynchronously via background threads, 
            ensuring zero latency overhead for your agent's primary loop.
          </p>
        </div>
      </section>

      {/* Support Footer */}
      <div className="pt-8 border-t border-zinc-800 flex flex-col items-center justify-center text-center space-y-4 mt-8">
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-none">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <h3 className="text-[16px] font-mono mt-4 font-bold tracking-widest text-white uppercase">Still need help?</h3>
        <p className="text-zinc-500 font-mono text-[12px] uppercase tracking-wider max-w-md">
          Join our developer community on Telegram or reach out to our team at 
          <span className="text-orange-500 ml-1 cursor-pointer hover:underline">tharagesharumugam@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
