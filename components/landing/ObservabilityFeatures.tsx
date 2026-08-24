"use client"

import { motion } from "framer-motion"
import { BarChart3, FileText, Activity, Terminal, Shield, CheckCircle } from "lucide-react"

const observabilityFeatures = [
  {
    category: "In-Memory Metrics",
    icon: BarChart3,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    metrics: [
      "Pipeline stage duration statistics",
      "Proposal throughput tracking",
      "p95 latency calculation benchmarks",
      "Success vs failure count rates",
      "Custom in-memory collector bounds",
      "Error categories grouping"
    ],
    desc: "Calculate processing percentiles directly inside the backend engine. Buffer stage events and group metrics dynamically by step."
  },
  {
    category: "Structured Logs",
    icon: FileText,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    metrics: [
      "Standard JSON-structured output format",
      "Categorized trace ID linkage",
      "Log severity levels: info, warn, error",
      "Proposal/Project context metadata tags",
      "Console stream output redirection",
      "Queryable records via timeline dashboard"
    ],
    desc: "Zero-dependency structured logs. Capture agent activity, duration timings, status codes, and error trace identifiers."
  },
  {
    category: "Trace Correlation",
    icon: Terminal,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    metrics: [
      "UUID trace ID correlation propagation",
      "Link SDK calls to dashboard events",
      "Trace lifecycle correlation in logging",
      "Step-by-step reasoning steps tracking",
      "Proposal status correlation states",
      "API request tracking hashes"
    ],
    desc: "Trace requests from agent script to DB. Associate every reasoning decision and context injection with unique transaction IDs."
  },
  {
    category: "Health Checks",
    icon: Activity,
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
    metrics: [
      "System ready/live liveness indicators",
      "Ping heartbeat latency monitoring",
      "Supabase connection integrity check",
      "Redis lock queue connectivity checks",
      "System warning detection logs",
      "Token budget consumption alerts"
    ],
    desc: "Proactive service checks. Monitor database readiness, ping response speeds, and active memory queue bounds."
  }
]

export default function ObservabilityFeatures() {
  return (
    <section id="observability" className="py-24 px-6 bg-paper border-y border-line">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">OBSERVABILITY ENGINE</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
            Integrated <span className="text-vermilion">Observability</span>
          </h2>
          <p className="text-ink-soft text-sm max-w-xl mx-auto">
            Correlate logs, track percentiles, and check agent health metrics directly inside your control panel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {observabilityFeatures.map((feature, i) => (
            <motion.div
              key={feature.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className={`bg-paper-card border ${feature.border} p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col justify-between`}>
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color} shrink-0`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-display text-base font-bold uppercase tracking-wider text-ink`}>
                        {feature.category}
                      </h3>
                      <p className="text-ink-soft text-[11px] leading-relaxed mt-2">{feature.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-line-soft">
                  {feature.metrics.map((metric, mi) => (
                    <div
                      key={metric}
                      className="flex items-center gap-2 text-[10px] text-muted group-hover:text-ink-soft transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-moss flex-shrink-0" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
