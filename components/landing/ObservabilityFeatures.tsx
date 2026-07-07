"use client"

import { motion } from "framer-motion"
import {
  BarChart3,
  Network,
  FileText,
  Activity,
  Bell,
  Clock,
  Zap,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
} from "lucide-react"

const observabilityFeatures = [
  {
    category: "Metrics",
    icon: BarChart3,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    metrics: [
      "Pipeline latency (p50, p95, p99)",
      "Proposal throughput (req/s)",
      "Brain version publish rate",
      "Context injection token usage",
      "Agent heartbeat intervals",
      "Error rates by category",
    ],
    desc: "High-cardinality metrics with sub-second granularity. Built on Prometheus-compatible format. Custom dashboards per project.",
  },
  {
    category: "Distributed Tracing",
    icon: Network,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    metrics: [
      "End-to-end proposal flow",
      "Cross-agent handoff traces",
      "Context injection spans",
      "SDK → API → DB latency",
      "Retry & backoff visualization",
      "Root cause analysis",
    ],
    desc: "OpenTelemetry-native. W3C TraceContext propagation. Every proposal tracked from agent submission to brain publication.",
  },
  {
    category: "Structured Logs",
    icon: FileText,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    metrics: [
      "JSON-structured log entries",
      "Correlated with trace IDs",
      "Log levels: debug, info, warn, error",
      "Searchable by any field",
      "Retention: 30d (Indie), 90d (Studio)",
      "Export to SIEM (Datadog, Splunk)",
    ],
    desc: "Zero-config structured logging. Every SDK call auto-instrumented. Query language for complex filtering.",
  },
  {
    category: "Health & Alerting",
    icon: Activity,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    metrics: [
      "Brain health score (quality, trust, coverage)",
      "Agent liveness & silent detection",
      "Pipeline stage SLA monitoring",
      "Token budget alerts",
      "Security event notifications",
      "Telegram / Email / Webhook delivery",
    ],
    desc: "Proactive health checks. Multi-channel alerting with deduplication. Escalation policies per project.",
  },
]

const sdkObservability = [
  { name: "Token Usage", desc: "Per-request token counting with model breakdown", icon: Cpu },
  { name: "Latency", desc: "Client-side + server-side latency percentiles", icon: Clock },
  { name: "Errors", desc: "Categorized: validation, auth, timeout, rate-limit", icon: Wifi },
  { name: "Checkpoints", desc: "State hydration/restore timing", icon: HardDrive },
  { name: "Injections", desc: "Context relevance scores & token budgets", icon: Zap },
  { name: "Heartbeats", desc: "Agent liveness with configurable thresholds", icon: Activity },
]

export default function ObservabilityFeatures() {
  return (
    <section id="observability" className="py-20 px-6 bg-[#0d0d0d] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">OBSERVABILITY STACK</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Full-Stack <span className="text-orange-500">Observability</span>
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            Metrics, traces, logs, and health in one platform. OpenTelemetry native. Zero vendor lock-in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {observabilityFeatures.map((feature, i) => (
            <motion.div
              key={feature.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className={`bg-[#111] border ${feature.border} p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]`}>
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.border} ${feature.color} shrink-0`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-mono text-lg font-bold uppercase tracking-wider ${feature.color}`}>
                      {feature.category}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">{feature.desc}</p>

                {/* Metrics */}
                <div className="space-y-2">
                  {feature.metrics.map((metric, mi) => (
                    <motion.div
                      key={metric}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + mi * 0.05 }}
                      className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors"
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${feature.color} flex-shrink-0`} />
                      <span>{metric}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SDK-Level Observability */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-amber-500" />
            SDK-Level Instrumentation
          </h3>
          <p className="text-zinc-500 font-mono text-sm mb-6">Auto-instrumented. No code changes required.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sdkObservability.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider">{item.name}</h4>
                </div>
                <p className="font-mono text-xs text-zinc-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integration Targets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
            <Network className="w-6 h-6 text-blue-500" />
            Export & Integrate
          </h3>
          <div className="flex flex-wrap gap-3">
            {["Prometheus", "Grafana", "Datadog", "Splunk", "Elastic", "Honeycomb", "Custom Webhook"].map((target) => (
              <span
                key={target}
                className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg font-mono text-sm text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
              >
                {target}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}