'use client'

import { motion } from "framer-motion"

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 px-6 bg-[#0d0d0d] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">SYSTEM ARCHITECTURE</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            How AgentHelm Works
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            A layered architecture that puts the Project Brain at the center of your AI engineering workflow.
          </p>
        </div>

        <div className="space-y-12">
          {/* Layered Diagram */}
          <motion.div
            key="architecture-diagram"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative h-96"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
            <div className="relative h-full w-full">
              {/* Layers */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                {/* Layer 1: Agents */}
                <div className="flex items-center gap-6 text-center">
                  <div className="relative w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full" />
                    <span className="text-orange-500 text-xl">🤖</span>
                  </div>
                  <p className="font-mono text-sm font-bold text-white uppercase tracking-wider">AI Agents</p>
                </div>

                {/* Layer 2: Brain Pipeline */}
                <div className="flex items-center gap-6 text-center">
                  <div className="relative w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full" />
                    <span className="text-orange-500 text-xl">⚙️</span>
                  </div>
                  <p className="font-mono text-sm font-bold text-white uppercase tracking-wider">Brain Pipeline</p>
                </div>

                {/* Layer 3: Project Brain */}
                <div className="relative w-16 h-16 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full" />
                  <span className="text-orange-500 text-xl">🧠</span>
                </div>
                <p className="font-mono text-sm font-bold text-white uppercase tracking-wider">Project Brain</p>
              </div>

              {/* Connecting lines */}
              <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-orange-500/50 via-zinc-700 to-zinc-700" />
              {/* Dots on lines */}
              <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full -translate-x-1/2 top-1/2 -translate-y-1/2" />
              <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full -translate-x-1/2 -translate-z-1/2 top-1/2 -translate-y-1/2" />
            </div>
          </motion.div>

          {/* Flow Description */}
          <motion.div
            key="architecture-flow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]">
              <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
                The AgentHelm Flow
              </h3>
              <ol className="space-y-4 list-decimal pl-6 font-mono text-zinc-400">
                <li>
                  <span className="font-bold text-white">1. Agent Action</span> - Your AI agent performs a task and generates insights
                </li>
                <li>
                  <span className="font-bold text-white">2. Knowledge Proposal</span> - Agent submits what it learned to the Brain Pipeline
                </li>
                <li>
                  <span className="font-bold text-white">3. Pipeline Processing</span> - Knowledge goes through validation, sanitization, and analysis
                </li>
                <li>
                  <span className="font-bold text-white">4. Merge Planning</span> - System plans how to integrate new knowledge with existing brain
                </li>
                <li>
                  <span className="font-bold text-white">5. Brain Update</span> - Project Brain is updated with new knowledge (versioned)
                </li>
                <li>
                  <span className="font-bold text-white">6. Context Injection</span> - Relevant knowledge is pulled and injected into agent context
                </li>
                <li>
                  <span className="font-bold text-white">7. Continuous Learning</span> - Cycle repeats, making agents smarter over time
                </li>
              </ol>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-3">
                  Key Components
                </h3>
                <ul className="space-y-2 list-disc pl-5 font-mono text-zinc-400">
                  <li><span className="font-bold">Project Brain:</span> Versioned knowledge base</li>
                  <li><span className="font-bold">Brain Pipeline:</span> Secure processing pipeline</li>
                  <li><span className="font-bold">Context Engine:</span> Intelligent knowledge retrieval</li>
                  <li><span className="font-bold">SDK Layer:</span> Framework-agnostic integration</li>
                  <li><span className="font-bold">Observability:</span> Metrics, traces, logs</li>
                  <li><span className="font-bold">Security:</span> Fail-closed protections</li>
                </ul>
              </div>
              <div className="bg-[#111] border border-zinc-800 p-6 rounded-xl transition-all hover:border-current/50 hover:shadow-[0_0_30_10px]">
                <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-3">
                  Data Flow
                </h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Knowledge flows in a secure, validated loop from agents to brain and back.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-500 font-mono">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" /> Agents → Pipeline
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 font-mono">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" /> Pipeline → Brain
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 font-mono">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" /> Brain → Agents
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}