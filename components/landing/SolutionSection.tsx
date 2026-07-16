"use client"

import { motion } from "framer-motion"
import { Brain, Zap, RefreshCw, CheckCircle } from "lucide-react"

export default function SolutionSection() {
  return (
    <section id="solution" className="py-24 px-6 bg-[#08080a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-[#ff6b35]/60 uppercase tracking-[0.3em] block mb-3">THE SOLUTION</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            One Project Brain for All Agents
          </h2>
          <p className="text-zinc-400 font-mono text-sm max-w-xl mx-auto leading-relaxed">
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
            className="relative bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden p-8 flex flex-col justify-center min-h-[340px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,53,0.05),transparent_70%)] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Project Brain
                  </h4>
                  <p className="text-zinc-500 font-mono text-xs leading-relaxed">
                    A centralized, version-controlled knowledge base containing repo styling schemas, API declarations, and design rules.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Context Injection
                  </h4>
                  <p className="text-zinc-500 font-mono text-xs leading-relaxed">
                    Rank and select knowledge segments dynamically to supply relevant context rules to agents before they start writing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Continuous Sync Loop
                  </h4>
                  <p className="text-zinc-500 font-mono text-xs leading-relaxed">
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
            className="flex flex-col justify-between bg-[#111113] border border-zinc-800 p-8 rounded-2xl"
          >
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-6">
                Ecosystem Integration Benefits
              </h3>
              <ul className="space-y-3 font-mono text-xs text-zinc-400">
                {[
                  "Prevent duplicate engineering setup loops",
                  "Enforce design patterns consistently",
                  "Retain critical architecture decisions",
                  "Simplify agent context windows token usage",
                  "Audit code generation choices in timeline logs",
                  "Catch invalid dependencies at ingestion validation"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-800/50 font-mono text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">
              Compatible out of the box with Cursor, Windsurf, Claude Code, and custom autonomous LLM setups.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}