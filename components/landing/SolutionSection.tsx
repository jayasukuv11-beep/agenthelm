"use client"

import { motion } from "framer-motion"
import { Brain, Zap, RefreshCw, CheckCircle } from "lucide-react"

export default function SolutionSection() {
  return (
    <section id="solution" className="py-24 px-6 bg-paper-dim/40 border-y border-line">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">THE SOLUTION</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
            One Project Brain for All Agents
          </h2>
          <p className="text-ink-soft text-sm max-w-xl mx-auto leading-relaxed">
            AgentHelm builds a shared memory repository that persists across agents, sessions, and platforms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: Visual Concept */}
          <motion.div
            key="solution-illustration"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="relative bg-paper-card border border-line rounded-2xl overflow-hidden p-8 flex flex-col justify-center min-h-[340px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,74,42,0.05),transparent_70%)] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center text-vermilion shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-1">
                    Project Brain
                  </h4>
                  <p className="text-muted text-xs leading-relaxed">
                    A centralized, version-controlled knowledge base containing repo styling schemas, API declarations, and design rules.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center text-vermilion shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-1">
                    Context Injection
                  </h4>
                  <p className="text-muted text-xs leading-relaxed">
                    Rank and select knowledge segments dynamically to supply relevant context rules to agents before they start writing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center text-vermilion shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-1">
                    Continuous Sync Loop
                  </h4>
                  <p className="text-muted text-xs leading-relaxed">
                    Agents propose newly discovered project decisions back into the ingestion validation queue, keeping the brain up-to-date.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Benefits Checklist */}
          <motion.div
            key="solution-benefits"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="flex flex-col justify-between bg-paper-card border border-line p-8 rounded-2xl"
          >
            <div>
              <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-6">
                Ecosystem Integration Benefits
              </h3>
              <ul className="space-y-3 text-xs text-ink-soft">
                {[
                  "Prevent duplicate engineering setup loops",
                  "Enforce design patterns consistently",
                  "Retain critical architecture decisions",
                  "Simplify agent context windows token usage",
                  "Audit code generation choices in timeline logs",
                  "Catch invalid dependencies at ingestion validation"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-moss shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-line-soft text-[10px] text-muted leading-relaxed uppercase tracking-wider">
              Compatible out of the box with Cursor, Windsurf, Claude Code, and custom autonomous LLM setups.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
