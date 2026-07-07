'use client'

import { motion } from "framer-motion"

export default function SolutionSection() {
  return (
    <section id="solution" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">THE SOLUTION</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            One Project Brain for All Agents
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            AgentHelm creates a shared knowledge base that persists across agents, sessions, and frameworks. Your agents remember everything.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Illustration */}
          <motion.div
            key="solution-illustration"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="relative h-96"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="relative h-full w-full bg-[#111] border border-zinc-800 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,87,34,0.1),transparent_70%)]" />
              <div className="relative h-full p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-orange-500 text-xl">🧠</span>
                    </div>
                    <div>
                      <h4 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-1">
                        Project Brain
                      </h4>
                      <p className="text-zinc-400 text-sm">
                        Shared knowledge base for all agents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-orange-500 text-xl">🔌</span>
                    </div>
                    <div>
                      <h4 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-1">
                        Context Injection
                      </h4>
                      <p className="text-zinc-400 text-sm">
                        Relevant knowledge delivered to agents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-orange-500 text-xl">🔄</span>
                    </div>
                    <div>
                      <h4 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-1">
                        Continuous Learning
                      </h4>
                      <p className="text-zinc-400 text-sm">
                        Agents teach the brain, brain teaches agents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            key="solution-benefits"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]">
              <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
                How It Works
              </h3>
              <ol className="space-y-4 list-decimal pl-6 font-mono text-zinc-400">
                <li>
                  <span className="font-bold text-white">Agent submits proposal</span> - Your agent shares what it learned
                </li>
                <li>
                  <span className="font-bold text-white">Brain Pipeline validates</span> - Security, sanity, and quality checks
                </li>
                <li>
                  <span className="font-bold text-white">Knowledge analyzed</span> - Patterns extracted, conflicts detected
                </li>
                <li>
                  <span className="font-bold text-white">Merge planned</span> - Intelligent integration with existing knowledge
                </li>
                <li>
                  <span className="font-bold text-white">Published to brain</span> - New version of project knowledge created
                </li>
                <li>
                  <span className="font-bold text-white">Context injected</span> - Relevant knowledge delivered to agents
                </li>
              </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-3">
                  Benefits
                </h3>
                <ul className="space-y-2 list-disc pl-5 font-mono text-zinc-400">
                  <li>Eliminate duplicate work</li>
                  <li>Ensure architectural consistency</li>
                  <li>Prevent knowledge loss</li>
                  <li>Accelerate onboarding</li>
                  <li>Improve code quality</li>
                  <li>Reduce security risks</li>
                </ul>
              </div>
              <div className="bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-3">
                  Works With Any Agent
                </h3>
                <p className="text-zinc-400 text-sm mb-4">
                  AgentHelm is framework-agnostic. Connect any AI coding agent:
                </p>
                <ul className="space-y-1 list-disc pl-5 font-mono text-zinc-400">
                  <li>Claude Code</li>
                  <li>Cursor</li>
                  <li>Codex</li>
                  <li>OpenAI SDK</li>
                  <li>CrewAI</li>
                  <li>LangGraph</li>
                  <li>Any custom agent</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}