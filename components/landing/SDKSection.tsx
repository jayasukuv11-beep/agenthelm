"use client"

import { motion } from "framer-motion"
import { Terminal, Code, Globe, Zap, Database, Download, CheckCircle, FileText, Cpu } from "lucide-react"

const sdks = [
  {
    name: "Python SDK",
    icon: Terminal,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    install: "pip install agenthelm-sdk",
    import: "import agenthelm",
    connect: 'dock = agenthelm.connect("ahe_live_...", name="My Agent")',
    features: [
      "Async/await native handlers",
      "Type hinting support built-in",
      "Pydantic-based payload models",
      "Context managers for checkpointing",
      "Decorator safety (@read, @side_effect)",
      "Reconnections with backoff logic"
    ],
    version: "1.1.0",
    pyPi: "https://pypi.org/project/agenthelm-sdk",
  },
  {
    name: "Node.js SDK",
    icon: Code,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    install: "npm install agenthelm-node-sdk",
    import: "const { AgentHelm } = require('agenthelm-node-sdk')",
    connect: 'const dock = new AgentHelm("ahe_live_...", { name: "My Agent" })',
    features: [
      "First-class TypeScript support",
      "ESM + CommonJS dual-package bundling",
      "Zod schema validation structures",
      "Structured output event emitters",
      "Lifecycle graceful shutdown hooks",
      "Local logging adapters correlation"
    ],
    version: "1.0.1",
    npm: "https://www.npmjs.com/package/agenthelm-node-sdk",
  },
  {
    name: "REST API",
    icon: Globe,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    install: "curl -H 'Authorization: Bearer ***'",
    import: "Language agnostic HTTP client requests",
    connect: "POST /api/sdk/proposals\nPOST /api/sdk/inject\nPOST /api/sdk/ping",
    features: [
      "Standard HTTP POST JSON payloads",
      "JWT Bearer authentication header validation",
      "Detailed validation error codes returned",
      "Stateless event timeline reporting endpoints",
      "Idempotency proposal hash verification",
      "CORS-ready REST endpoint bindings"
    ],
    version: "v1",
    docs: "/docs",
  },
]

const coreCapabilities = [
  { name: "Context Injection", icon: Zap, desc: "Token-budgeted relevance scoring. Injects only the most relevant brain entries for the current task hint." },
  { name: "State Checkpoints", icon: Database, desc: "Automatically persist agent state snapshots. Resume from precise step index on failures." },
  { name: "Safety Decorators", icon: FileText, desc: "@read, @side_effect, @irreversible declarations. Hold dangerous operations for approval." },
  { name: "Telegram Bot Alerting", icon: Cpu, desc: "Receive immediate notifications on high errors, token consumption spikes, or liveness failures." },
  { name: "Structured Logging", icon: FileText, desc: "Trace events correlated with UUID transaction identifiers. Clean JSON logs emitted to console." },
  { name: "Metrics Collector", icon: Cpu, desc: "Compute duration averages and p95 latency statistics per pipeline stage in memory." },
]

export default function SDKSection() {
  return (
    <section id="sdk" className="py-24 px-6 bg-paper-dim/40 border-y border-line">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">PRODUCTION SDKs</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
            Unified SDK <span className="text-vermilion">Integrations</span>
          </h2>
          <p className="text-ink-soft text-sm max-w-xl mx-auto">
            Choose your runtime language. Same core capabilities, security boundaries, and telemetry correlation.
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
              <div className={`bg-paper-card border ${sdk.border} p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col justify-between`}>
                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sdk.bg} ${sdk.color} shrink-0`}>
                      <sdk.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-display text-base font-bold uppercase tracking-wider text-ink`}>
                        {sdk.name}
                      </h3>
                      <span className="font-mono text-[10px] text-muted uppercase tracking-widest">v{sdk.version}</span>
                    </div>
                  </div>

                  {/* Install */}
                  <div className="space-y-2 mb-6">
                    <div className="bg-[#08080a] border border-line rounded-xl p-3 font-mono text-xs overflow-x-auto">
                      <code className="text-vermilion text-[11px]">{sdk.install}</code>
                    </div>
                    <div className="bg-[#08080a] border border-line rounded-xl p-3 font-mono text-xs overflow-x-auto">
                      <code className="text-vermilion text-[11px]">{sdk.import}</code>
                    </div>
                    <div className="bg-[#08080a] border border-line rounded-xl p-3 font-mono text-xs overflow-x-auto">
                      <code className="text-vermilion text-[11px]">{sdk.connect}</code>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {sdk.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-[11px] text-ink-soft">
                        <CheckCircle className="w-3.5 h-3.5 text-moss flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex gap-3 pt-4 border-t border-line">
                  {sdk.pyPi && (
                    <a href={sdk.pyPi} target="_blank" rel="noopener noreferrer" className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-muted hover:text-vermilion transition-colors flex items-center justify-center gap-1.5 py-1">
                      <Download className="w-3.5 h-3.5" />
                      PyPI
                    </a>
                  )}
                  {sdk.npm && (
                    <a href={sdk.npm} target="_blank" rel="noopener noreferrer" className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-muted hover:text-vermilion transition-colors flex items-center justify-center gap-1.5 py-1">
                      <Download className="w-3.5 h-3.5" />
                      NPM
                    </a>
                  )}
                  {sdk.docs && (
                    <a href={sdk.docs} className="flex-1 text-center font-mono text-xs uppercase tracking-wider text-muted hover:text-vermilion transition-colors flex items-center justify-center gap-1.5 py-1">
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
          <h3 className="font-display text-lg font-bold text-ink uppercase tracking-wider mb-6 flex items-center gap-3 justify-center">
            <Cpu className="w-5 h-5 text-vermilion" />
            Core Agent Capabilities
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreCapabilities.map((cap, i) => (
              <motion.div
                key={cap.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-paper-card border border-line rounded-xl hover:border-ink-soft transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-vermilion-soft border border-vermilion/20 flex items-center justify-center text-vermilion shrink-0 mt-0.5">
                    <cap.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-bold text-ink uppercase tracking-wider mb-1">{cap.name}</h4>
                    <p className="text-[11px] text-muted leading-relaxed">{cap.desc}</p>
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
