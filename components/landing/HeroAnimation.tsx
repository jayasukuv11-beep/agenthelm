"use client"

import { useEffect, useRef, useState } from "react"
import { Brain, Zap, Terminal, GitBranch, Server, Users, ArrowRight, FileText, CheckCircle2, Search, GitMerge, Package } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

const agents = [
  { name: "Claude Code", icon: Terminal, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { name: "Cursor", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { name: "Codex", icon: GitBranch, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "OpenAI SDK", icon: Server, color: "text-purple-400", bg: "bg-purple-500/10" },
  { name: "CrewAI", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
]

const pipelineStages = [
  { name: "Proposal", icon: FileText, desc: "Agent submits knowledge" },
  { name: "Validation", icon: CheckCircle2, desc: "Sanitize & verify" },
  { name: "Analysis", icon: Search, desc: "Evidence & confidence" },
  { name: "Merge Plan", icon: GitMerge, desc: "Conflict resolution" },
  { name: "Publish", icon: Package, desc: "Version & deploy" },
  { name: "Brain", icon: Brain, desc: "Shared knowledge" },
  { name: "Context", icon: Zap, desc: "Inject to agents" },
]

export default function HeroAnimation() {
  const [phase, setPhase] = useState<"agents" | "pipeline" | "brain" | "context">("agents")
  const [pipelineIndex, setPipelineIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (shouldReduceMotion) {
      const t = setTimeout(() => {
        setPhase("context")
        setPipelineIndex(pipelineStages.length - 1)
      }, 0)
      return () => clearTimeout(t)
    }

    const sequence = async () => {
      // Phase 1: Agents flow in
      setPhase("agents")
      for (let i = 0; i < agents.length; i++) {
        await new Promise(r => setTimeout(r, 400))
      }
      await new Promise(r => setTimeout(r, 600))

      // Phase 2: Pipeline stages animate
      setPhase("pipeline")
      for (let i = 0; i < pipelineStages.length; i++) {
        setPipelineIndex(i)
        await new Promise(r => setTimeout(r, 350))
      }
      await new Promise(r => setTimeout(r, 600))

      // Phase 3: Brain forms
      setPhase("brain")
      await new Promise(r => setTimeout(r, 1000))

      // Phase 4: Context injection
      setPhase("context")
      await new Promise(r => setTimeout(r, 1000))

      // Loop
      setPipelineIndex(0)
      sequence()
    }

    const timer = setTimeout(sequence, 500)
    return () => clearTimeout(timer)
  }, [shouldReduceMotion])

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto py-12"
      style={{ minHeight: 420 }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Flow lines connecting agents to pipeline */}
      <AnimatePresence mode="wait">
        {phase !== "agents" && (
          <motion.svg
            className="absolute left-1/2 top-[100px] -translate-x-1/2 w-[80%] h-[60px] pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              d="M 50,0 C 50,30 50,70 50,100"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="8 4"
              style={{ animation: "flow 2s linear infinite" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Phase 1: Agent Cards Flowing In */}
      <AnimatePresence mode="popLayout">
        {phase === "agents" && (
          <motion.div
            key="agents"
            className="flex flex-wrap justify-center items-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 40, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.8 }}
                transition={{
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                className={`group ${agent.bg} border border-current/20 px-4 py-3 rounded-xl flex items-center gap-3 transition-all hover:scale-105 hover:border-current/40 cursor-default`}
                style={{ borderColor: agent.color }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${agent.bg} ${agent.color}`}>
                  <agent.icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-sm font-bold text-white">{agent.name}</span>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2: Pipeline Stages */}
      <AnimatePresence mode="popLayout">
        {(phase === "pipeline" || phase === "brain" || phase === "context") && (
          <motion.div
            key="pipeline"
            className="relative flex flex-wrap justify-center items-start gap-2 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Connecting line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-zinc-700 to-transparent -z-10" />

            {pipelineStages.map((stage, i) => {
              const StageIcon = stage.icon
              return (
                <motion.div
                  key={stage.name}
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{
                    opacity: i <= pipelineIndex ? 1 : 0.3,
                    y: 0,
                    scale: i <= pipelineIndex ? 1 : 0.9
                  }}
                  exit={{ opacity: 0, y: -40, scale: 0.8 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  className="flex flex-col items-center gap-2 px-2"
                >
                  <motion.div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${
                      i <= pipelineIndex
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)]"
                        : "border-zinc-700 bg-zinc-900/50 text-zinc-600"
                    }`}
                    animate={{
                      scale: i === pipelineIndex && phase === "pipeline" ? [1, 1.1, 1] : 1,
                      boxShadow: i === pipelineIndex && phase === "pipeline"
                        ? ["0 0 30px -5px rgba(99,102,241,0.4)", "0 0 50px -5px rgba(99,102,241,0.6)", "0 0 30px -5px rgba(99,102,241,0.4)"]
                        : "0 0 30px -5px rgba(99,102,241,0.4)"
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <StageIcon className="w-6 h-6" />
                  </motion.div>
                  <span className={`font-mono text-xs uppercase tracking-wider text-center w-20 ${
                    i <= pipelineIndex ? "text-white" : "text-zinc-600"
                  }`}>{stage.name}</span>
                  <span className={`font-mono text-[10px] text-center w-24 ${
                    i <= pipelineIndex ? "text-zinc-500" : "text-zinc-700"
                  }`}>{stage.desc}</span>

                  {/* Arrow between stages */}
                  {i < pipelineStages.length - 1 && (
                    <motion.div
                      className="absolute top-6 left-[calc(100%_-_8px)] w-16 h-0.5 bg-gradient-to-r from-zinc-700 to-transparent -z-10"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: i < pipelineIndex ? 1 : 0 }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
                      style={{ transformOrigin: "left center" }}
                    />
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3: Project Brain */}
      <AnimatePresence mode="popLayout">
        {(phase === "brain" || phase === "context") && (
          <motion.div
            key="brain"
            className="relative flex justify-center items-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Outer pulse rings */}
            <motion.div
              className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-cyan-500/15 rounded-full"
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-emerald-500/10 rounded-full"
              animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0.05, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Brain core */}
            <motion.div
              className="relative w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/10 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(99,102,241,0.3)]"
              animate={{
                rotate: [0, 0, 2, -2, 0],
                boxShadow: ["0 0 60px -10px rgba(99,102,241,0.3)", "0 0 80px -5px rgba(6,182,212,0.4)", "0 0 60px -10px rgba(99,102,241,0.3)"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-16 h-16 text-indigo-400" />

              {/* Data particles orbiting */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-indigo-400/60 rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-48px) rotate(${-i * 60}deg)`
                  }}
                  animate={{
                    rotate: `${i * 60}deg`,
                    scale: [1, 0.5, 1],
                    opacity: [0.8, 0.3, 0.8]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>

            {/* Labels */}
            <motion.div
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="font-mono text-lg font-bold text-white uppercase tracking-widest">Project Brain</p>
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider mt-1">Active Memory · Sync Active · v3.2.1</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 4: Context Injection to Agents */}
      <AnimatePresence mode="popLayout">
        {phase === "context" && (
          <motion.div
            key="context"
            className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 100, damping: 15 }}
                className={`relative ${agent.bg} border border-current/30 px-3 py-3 rounded-xl flex flex-col items-center gap-2 transition-all`}
                style={{ borderColor: agent.color }}
              >
                <motion.div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full"
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [1, 0, 0],
                    y: [0, -20, -40]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agent.bg} ${agent.color}`}>
                  <agent.icon className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-white">{agent.name}</span>
                <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider">INJECTED</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loop indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span>Continuous sync</span>
      </motion.div>

      <style jsx global>{`
        @keyframes flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 12; }
        }
      `}</style>
    </div>
  )
}