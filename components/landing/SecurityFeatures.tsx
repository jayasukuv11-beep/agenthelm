"use client"

import { motion } from "framer-motion"
import { Shield, Key, FileText, Bell, CheckCircle } from "lucide-react"

const features = [
  {
    name: "JWT Authentication",
    icon: Shield,
    color: "text-moss",
    bg: "bg-moss-soft",
    border: "border-moss/20",
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
    color: "text-vermilion",
    bg: "bg-vermilion-soft",
    border: "border-vermilion/20",
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
    color: "text-sarvam",
    bg: "bg-sarvam-soft",
    border: "border-sarvam/20",
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
    color: "text-amber",
    bg: "bg-amber-soft",
    border: "border-amber/20",
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
            <div className={`bg-paper-card border ${feature.border} p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col justify-between relative overflow-hidden`}>
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color} shrink-0`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold uppercase tracking-wider text-ink">
                      {feature.name}
                    </h3>
                    <p className="text-ink-soft text-[11px] leading-relaxed mt-2">{feature.desc}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-line-soft">
                {feature.details.map((detail, di) => (
                  <div
                    key={detail}
                    className="flex items-center gap-2 text-[10px] text-muted group-hover:text-ink-soft transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-moss flex-shrink-0" />
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
        className="p-8 bg-vermilion-soft border border-vermilion/20 rounded-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 className="font-display text-base font-bold text-ink uppercase tracking-wider mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-vermilion" />
          Fail-Closed Design Paradigm
        </h3>
        <div className="grid md:grid-cols-3 gap-6 text-[11px]">
          {[
            { title: "Agent Silent Connection", desc: "Monitored at ingest. Auto-transitions to 'stopped' state if liveness heartbeat fails." },
            { title: "Validation Error", desc: "Rejected immediately. Never merges into target Project Brain. Emits warning code." },
            { title: "Permissions Defect", desc: "Blocked at runtime. Throws immediate SDK exception. Logs event to security alerts." }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-paper-card rounded-xl border border-line">
              <p className="text-vermilion uppercase tracking-widest font-bold mb-2">{item.title}</p>
              <p className="text-ink-soft leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
