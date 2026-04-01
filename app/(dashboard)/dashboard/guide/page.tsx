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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#10b981]/10 via-transparent to-transparent border border-[#10b981]/20 p-8 md:p-12">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Everything you need <br />to secure your agents.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            AgentHelm is a production-grade safety platform for AI Agents. 
            Monitor state in real-time, enforce human-in-the-loop safety boundaries, 
            and recover from failures with absolute integrity.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#10b981]/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Quick Start Card */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Rocket className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold">Quick Start (SDK)</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-400">Python SDK v0.3.0</span>
              <Code2 className="w-4 h-4 text-gray-500" />
            </div>
            <code className="block bg-black/50 p-3 rounded-lg text-sm text-gray-300 font-mono">
              pip install agenthelm-sdk
            </code>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Optimized Hybrid Sync model</p>
              <p>• Built-in SHA256 state integrity</p>
              <p>• Native "Fail-Closed" tool decorators</p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-400">Node.js SDK v0.4.0</span>
              <Code2 className="w-4 h-4 text-gray-500" />
            </div>
            <code className="block bg-black/50 p-3 rounded-lg text-sm text-gray-300 font-mono">
              npm install agenthelm-node-sdk
            </code>
            <div className="space-y-2 text-sm text-gray-400">
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
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-semibold">Safety Firewall (Fail-Closed)</h2>
        </div>
        
        <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">1</span>
              </div>
              <h3 className="font-medium text-white">Classification</h3>
              <p className="text-sm text-gray-400">Categorize tool calls as Read-only, Side Effect, or Irreversible.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">2</span>
              </div>
              <h3 className="font-medium text-white">Intervention Gating</h3>
              <p className="text-sm text-gray-400">Irreversible actions are held in a pending state until approved by you via Dashboard or Telegram.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-400">3</span>
              </div>
              <h3 className="font-medium text-white">60s Auto-Reject</h3>
              <p className="text-sm text-gray-400">If no approval is received within 60 seconds, the tool call is automatically rejected to prevent "zombie" actions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram Command Guide */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-sky-400" />
          </div>
          <h2 className="text-2xl font-semibold">Telegram Remote Control</h2>
        </div>

        <div className="bg-[#111111] border border-[#1f2937] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1a1a] text-gray-400 border-b border-[#1f2937]">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Command</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Icon</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              <tr>
                <td className="px-6 py-4 font-mono text-emerald-400">/status</td>
                <td className="px-6 py-4 text-center">📊</td>
                <td className="px-6 py-4 text-gray-400">See current agent progress, token usage, and last checkpoint.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono text-emerald-400">/logs</td>
                <td className="px-6 py-4 text-center">📋</td>
                <td className="px-6 py-4 text-gray-400">View the last 5 logs from your active agent session.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono text-emerald-400">/run [name]</td>
                <td className="px-6 py-4 text-center">▶️</td>
                <td className="px-6 py-4 text-gray-400">Start a specific agent or launch your primary stack.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono text-emerald-400">/stop [name]</td>
                <td className="px-6 py-4 text-center">🛑</td>
                <td className="px-6 py-4 text-gray-400">Safely stop an agent via a "Confirm Stop" interactive button.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono text-emerald-400">/resume</td>
                <td className="px-6 py-4 text-center">🚀</td>
                <td className="px-6 py-4 text-gray-400">Restart a task from the last valid checkpoint using SHA256 validation.</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-mono text-emerald-400">/credits</td>
                <td className="px-6 py-4 text-center">💳</td>
                <td className="px-6 py-4 text-gray-400">Check your monthly token limits and current consumption.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* New Infrastructure Features */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-8 space-y-4 hover:border-[#10b981]/30 transition-colors">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-semibold text-white">Multi-Currency Billing</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Credits and subscription costs are now dynamically localized based on your region. 
            Indian users see <code className="text-blue-300">INR (₹)</code> while international 
            users use <code className="text-blue-300">USD ($)</code>.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-8 space-y-4 hover:border-[#10b981]/30 transition-colors">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-semibold text-white">AI-Ready Protocol</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            The platform is now machine-readable via <code className="text-emerald-300">llms.txt</code>. 
            Optimized for AI coding assistants like Cursor and Windsurf to instantly 
            understand your secure agent architecture.
          </p>
        </div>
      </section>

      {/* Persistence & Integrity */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Integrity Hashing</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Every checkpoint includes a <code className="text-purple-300">state_hash</code> (SHA256). 
            When resuming, AgentHelm verifies the hash to ensure the state hasn't 
            been corrupted or tampered with during downtime.
          </p>
        </div>

        <div className="bg-[#111111] border border-[#1f2937] rounded-xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-semibold text-white">Hybrid Sync</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Non-critical telemetry (logs, output, progress) is synced asynchronously via background threads, 
            ensuring zero latency overhead for your agent's primary loop.
          </p>
        </div>
      </section>

      {/* Support Footer */}
      <div className="pt-8 border-t border-[#1f2937] flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 bg-red-400/10 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold">Still need help?</h3>
        <p className="text-gray-400 max-w-md">
          Join our developer community on Telegram or reach out to our team at 
          <span className="text-[#10b981] ml-1 cursor-pointer">tharagesharumugam@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
