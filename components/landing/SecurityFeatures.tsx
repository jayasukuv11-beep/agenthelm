"use client"

import { motion } from "framer-motion"
import { Shield, Key, FileText, Bell, CheckCircle } from "lucide-react"

const features = [
  {
    name: "JWT Authentication",
    icon: Shield,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    desc: "Every SDK request runs authenticated via JSON Web Tokens. Agent tokens are generated during handshakes, expire in 12 hours, and are validated using secure HSM key hashes.",
    details: [
      "12-hour token expiration lifecycle",
      "Dynamic handshake protocol validation",
      "Cryptographic HS256 JWT signature verification",
      "Per-agent token isolation safeguards"
    ]
  },
  {
    name: "Scoped Tool Permissions",
    icon: Key,
    color: "text-[#ff6b35]",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    desc: "Enforce safety bounds on agent execution. Declare agent actions using decorators like @read, @side_effect, or @irreversible. Force human approval on irreversible actions.",
    details: [
      "Explicit tool validation allowlists",
      "Throw typed errors on unauthorized tool requests",
      "Hold irreversible tool calls in pending queue",
      "Human-in-the-loop validation via dashboard"
    ]
  },
  {
    name: "Audit Trail Logging",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    desc: "Maintain complete accountability for agent choices. Every context injection, knowledge proposal, and reasoning decision is tracked with permanent timestamp logs.",
    details: [
      "Immutable reasoning steps history",
      "Proposal submissions & merge status tracking",
      "Context injection requests correlation",
      "Complete agent lifecycle audit trail"
    ]
  },
  {
    name: "Anomaly Alerts",
    icon: Bell,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    desc: "Actively monitor for runaway agents. Detect token consumption spikes, silent crashes, and high error rate thresholds instantly to protect backend billing APIs.",
    details: [
      "Silent agent detection (10 min idle)",
      "High error rate trigger notifications (>20%)",
      "Sudden token spike checks (hourly avg multiplier)",
      "Real-time alerts via Telegram bot"
    ]
  }
]

export default function SecurityFeatures() {
  return (
    <div className="space-y-16">
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
            <div className={`bg-[#111113] border ${feature.border} p-6 rounded-2xl transition-all hover:border-zinc-700 h-full flex flex-col justify-between relative overflow-hidden`}>
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color} shrink-0`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-bold uppercase tracking-wider text-white">
                      {feature.name}
                    </h3>
                    <p className="text-zinc-400 font-mono text-[11px] leading-relaxed mt-2">{feature.desc}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-zinc-800/50">
                {feature.details.map((detail, di) => (
                  <div
                    key={detail}
                    className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors"
                  >
                    <CheckCircle className={`w-3.5 h-3.5 ${feature.color} flex-shrink-0`} />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Security Model Summary */}
      <motion.div
        className="p-8 bg-gradient-to-br from-orange-950/20 to-zinc-900/50 border border-orange-500/20 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-orange-500" />
          Fail-Closed Design Paradigm
        </h3>
        <div className="grid md:grid-cols-3 gap-6 text-[11px] font-mono">
          {[
            { title: "Agent Silent Connection", desc: "Monitored at ingest. Auto-transitions to 'stopped' state if liveness heartbeat fails." },
            { title: "Validation Error", desc: "Rejected immediately. Never merges into target Project Brain. Emits warning code." },
            { title: "Permissions Defect", desc: "Blocked at runtime. Throws immediate SDK exception. Logs event to security alerts." }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-[#08080a] rounded-xl border border-zinc-800/60">
              <p className="text-[#ff6b35] uppercase tracking-widest font-bold mb-2">{item.title}</p>
              <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}