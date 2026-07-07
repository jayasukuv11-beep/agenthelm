"use client"

import { motion } from "framer-motion"
import {
  Terminal,
  Code,
  Globe,
  Zap,
  Database,
  Download,
  ArrowRight,
  CheckCircle,
  FileText,
  Cpu,
} from "lucide-react"

const sdks = [
  {
    name: "Python SDK",
    icon: Terminal,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    install: "pip install agenthelm-sdk",
    import: "import agenthelm",
    connect: 'dock = agenthelm.connect("ahe_live_...", name="My Agent")',
    features: [
      "Async/await native",
      "Type hints (py.typed)",
      "Pydantic models",
      "Context managers for checkpoints",
      "Decorator-based safety (@read, @side_effect, @irreversible)",
      "Auto-reconnection with exponential backoff",
    ],
    version: "0.4.2",
    pyPi: "https://pypi.org/project/agenthelm-sdk",
  },
  {
    name: "Node.js SDK",
    icon: Code,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    install: "npm install agenthelm-sdk",
    import: "const { AgentHelm } = require('agenthelm-sdk')",
    connect: 'const dock = new AgentHelm("ahe_live_...", { name: "My Agent" })',
    features: [
      "TypeScript first-class support",
      "ESM + CommonJS dual package",
      "Zod schema validation",
      "Async iterators for streaming",
      "Classification-first decorators",
      "Graceful shutdown handling",
    ],
    version: "0.4.1",
    npm: "https://www.npmjs.com/package/agenthelm-sdk",
  },
  {
    name: "REST API",
    icon: Globe,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    install: "curl -H 'Authorization: Bearer ahe_live_...'",
    import: "Language agnostic — any HTTP client",
    connect: "POST /api/sdk/proposals\nPOST /api/sdk/inject\nPOST /api/sdk/command",
    features: [
      "OpenAPI 3.1 spec published",
      "JWT Bearer authentication",
      "Idempotency keys on mutations",
      "Rate limiting with headers",
      "Webhook callbacks for async ops",
      "Server-sent events for streaming",
    ],
    version: "v1",
    docs: "/docs/api",
  },
]

const coreCapabilities = [
  { name: "Context Injection", icon: Zap, desc: "Smart token budgeting with relevance scoring. Selects most relevant brain entries for the task hint." },
  { name: "Checkpointing", icon: Database, desc: "Automatic state persistence. Resume from exact failure point. Hydrate in <100ms." },
  { name: "Safety Decorators", icon: FileText, desc: "@read, @side_effect, @irreversible classification. Human approval for dangerous actions." },
  { name: "Telegram Control", icon: Cpu, desc: "Remote /dispatch, /status, /resume, /stop from phone. Real-time agent chat." },
  { name: "Structured Logging", icon: FileText, desc: "Auto-instrumented. Trace IDs correlated. JSON output for SIEM." },
  { name: "Metrics Export", icon: Cpu, desc: "Prometheus /metrics endpoint. Latency, tokens, errors, heartbeats." },
]

export default function SDKSection() {
  return (
    <section id="sdk" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">PRODUCTION SDKs</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Three Ways to <span className="text-orange-500">Integrate</span>
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            Pick your language. Same capabilities. Same security model. Same observability.
          </p>
        </div>

        {/* SDK Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {sdks.map((sdk, i) => (
            <motion.div
              key={sdk.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className={`bg-[#111] border ${sdk.border} p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px] h-full flex flex-col`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sdk.bg} ${sdk.border} ${sdk.color} shrink-0`}>
                    <sdk.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-mono text-lg font-bold uppercase tracking-wider ${sdk.color}`}>
                      {sdk.name}
                    </h3>
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">v{sdk.version}</span>
                  </div>
                </div>

                {/* Install */}
                <div className="space-y-3 mb-6">
                  <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                    <code className="text-orange-400">{sdk.install}</code>
                  </div>
                  <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                    <code className="text-purple-400">{sdk.import}</code>
                  </div>
                  <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                    <code className="text-yellow-400">{sdk.connect}</code>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 space-y-2 mb-6">
                  {sdk.features.map((feature, fi) => (
                    <div key={feature} className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      <CheckCircle className={`w-3.5 h-3.5 ${sdk.color} flex-shrink-0`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                  {sdk.pyPi && (
                    <a href={sdk.pyPi} target="_blank" rel="noopener noreferrer" className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      PyPI
                    </a>
                  )}
                  {sdk.npm && (
                    <a href={sdk.npm} target="_blank" rel="noopener noreferrer" className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      NPM
                    </a>
                  )}
                  {sdk.docs && (
                    <a href={sdk.docs} className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-zinc-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Docs
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Core Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3 text-center justify-center">
            <Cpu className="w-6 h-6 text-amber-500" />
            Core Capabilities (All SDKs)
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreCapabilities.map((cap, i) => (
              <motion.div
                key={cap.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    <cap.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-1">{cap.name}</h4>
                    <p className="font-mono text-xs text-zinc-500">{cap.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}