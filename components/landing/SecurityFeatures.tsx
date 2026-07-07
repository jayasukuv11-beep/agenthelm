"use client"

import { motion } from "framer-motion"
import {
  Shield,
  AlertTriangle,
  Key,
  FileText,
  Clock,
  Eye,
  Zap,
  CheckCircle,
  Lock,
  RotateCcw,
  Bug,
  ScanLine,
} from "lucide-react"

const features = [
  {
    name: "Replay Protection",
    icon: RotateCcw,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    desc: "Cryptographic nonce verification on every request. Each proposal carries a unique timestamped nonce. Server rejects duplicates within a sliding window. Prevents MITM replay attacks on knowledge submissions.",
    details: [
      "Nonce per proposal (timestamp + random)",
      "Sliding window: 5 minutes default",
      "Per-agent nonce tracking",
      "Automatic rotation on key regen",
    ],
  },
  {
    name: "Context Poisoning Defense",
    icon: Bug,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    desc: "Sanitization pipeline strips secrets, PII, and executable code from proposals before they enter the brain. Multi-layer validation: regex patterns, AST parsing for code, entropy detection for secrets.",
    details: [
      "Secret detection (API keys, tokens, passwords)",
      "PII scrubbing (emails, phones, IPs)",
      "Code execution prevention (eval, exec, import)",
      "Entropy-based anomaly detection",
    ],
  },
  {
    name: "Permission Validation",
    icon: Key,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    desc: "Scoped tool permissions with strict block mode. Agents declare required tools at registration. Runtime enforcement blocks unauthorized tool calls with typed errors. Default-deny posture for production.",
    details: [
      "Per-agent tool allowlists",
      "Block mode: throw on unauthorized",
      "Classification-first decorators (@read, @side_effect, @irreversible)",
      "Human approval for irreversible actions",
    ],
  },
  {
    name: "Audit Logs",
    icon: FileText,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    desc: "Immutable audit trail for every brain operation. Proposals, merges, context injections, permission changes, and access events. Tamper-evident with cryptographic chaining. Queryable via dashboard and API.",
    details: [
      "Proposal submit/approve/reject",
      "Context injection events",
      "Permission changes",
      "Brain version publishes",
      "Cryptographic hash chaining",
    ],
  },
]

export default function SecurityFeatures() {
  return (
    <section id="security" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">SECURITY ARCHITECTURE</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Built-In <span className="text-orange-500">Security</span>
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            Every layer hardened. Fail-closed by default. No secrets in the brain. No unauthorized tool calls. Full audit trail.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              <div className={`bg-[#111] border ${feature.border} p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px] relative overflow-hidden`}>
                {/* Accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${feature.bg}`} />

                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.border} ${feature.color} shrink-0`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-mono text-lg font-bold uppercase tracking-wider ${feature.color}`}>
                      {feature.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">{feature.desc}</p>

                {/* Details */}
                <div className="space-y-2">
                  {feature.details.map((detail, di) => (
                    <motion.div
                      key={detail}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + di * 0.05 }}
                      className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors"
                    >
                      <CheckCircle className={`w-3.5 h-3.5 ${feature.color} flex-shrink-0`} />
                      <span>{detail}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security Model Summary */}
        <motion.div
          className="mt-16 p-8 bg-gradient-to-br from-orange-950/30 to-purple-950/30 border border-orange-500/30 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-500" />
            Fail-Closed Security Model
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {[
              { title: "Connection Lost", desc: "Agent halts execution immediately. No unsupervised operation during outages." },
              { title: "Invalid Proposal", desc: "Rejected at ingest. Never enters brain. Detailed error returned to agent." },
              { title: "Unauthorized Tool", desc: "Blocked at runtime. Typed error thrown. Full audit entry created." },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="font-mono text-xs text-orange-500 uppercase tracking-widest mb-2">{item.title}</p>
                <p className="font-mono text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}