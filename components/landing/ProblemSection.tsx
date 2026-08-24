"use client"

import { motion } from "framer-motion"

export default function ProblemSection() {
  return (
    <section id="problem" className="py-24 px-6 bg-paper border-y border-line">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">THE PROBLEM</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
            AI Agents Forget Everything
          </h2>
          <p className="text-ink-soft text-sm max-w-xl mx-auto leading-relaxed">
            Every time your agent starts a new session, it begins with a blank slate. No memory of past decisions, configuration patterns, or API specifications.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Problem 1 */}
          <motion.div
            key="problem1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <div className="bg-paper-card border border-line p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center font-mono font-bold text-vermilion text-sm">
                    1
                  </div>
                  <h3 className="font-display text-base font-bold text-ink uppercase tracking-wider">
                    Context Amnesia
                  </h3>
                </div>
                <p className="text-ink-soft text-xs leading-relaxed mb-4">
                  Agents don't remember project architecture, API choices, or database migrations. Every run starts from scratch.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                  <span>Duplicate engineering overhead</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                  <span>Contradictory design paths</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Problem 2 */}
          <motion.div
            key="problem2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="bg-paper-card border border-line p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center font-mono font-bold text-vermilion text-sm">
                    2
                  </div>
                  <h3 className="font-display text-base font-bold text-ink uppercase tracking-wider">
                    Knowledge Silos
                  </h3>
                </div>
                <p className="text-ink-soft text-xs leading-relaxed mb-4">
                  Engineering context is locked in single agent sessions. What one agent learns is lost to all others on the codebase.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                  <span>No shared model memory</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                  <span>Inconsistent styling implementations</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Problem 3 */}
          <motion.div
            key="problem3"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3 }}
            className="group"
          >
            <div className="bg-paper-card border border-line p-6 rounded-2xl transition-all hover:border-ink-soft h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center font-mono font-bold text-vermilion text-sm">
                    3
                  </div>
                  <h3 className="font-display text-base font-bold text-ink uppercase tracking-wider">
                    Governance Drifts
                  </h3>
                </div>
                <p className="text-ink-soft text-xs leading-relaxed mb-4">
                  Without shared project standards, agents write code using deprecated functions or insecure library wrappers.
                </p>
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                  <span>API billing resource leaks</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted">
                  <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                  <span>Outdated pattern integration</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
