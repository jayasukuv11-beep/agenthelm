'use client'

import { motion } from "framer-motion"

export default function ProblemSection() {
  return (
    <section id="problem" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">THE PROBLEM</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            AI Agents Forget Everything
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            Every time your agent starts a new task, it begins with a blank slate. No memory of past decisions, architecture, or code patterns.
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
            <div className={`bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <span className="text-2x">1</span>
                </div>
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Context Amnesia
                </h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Agents don't remember project architecture, API decisions, or past code changes. Each session starts from zero.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Duplicate work</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Contradictory decisions</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Lost architectural knowledge</span>
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
            <div className={`bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <span className="text-2x">2</span>
                </div>
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Knowledge Silos
                </h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Knowledge is trapped in individual agents. What one agent learns never benefits others, even on the same project.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>No shared memory</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Reinventing the wheel</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Inconsistent implementations</span>
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
            <div className={`bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <span className="text-2x">3</span>
                </div>
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                  Trust & Safety Gaps
                </h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Without shared context, agents make unsafe decisions, use deprecated patterns, or introduce security vulnerabilities.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Security vulnerabilities</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Deprecated API usage</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                  <span>Architecture drift</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}