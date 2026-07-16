"use client"

import { motion } from "framer-motion"
import {
  Terminal,
  Code,
  GitBranch,
  Zap,
  Server,
  Database,
  Globe,
  Users,
  Network,
  CheckCircle,
  ExternalLink,
} from "lucide-react"

const integrations = [
  {
    category: "AI Coding Agents",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    items: [
      { name: "Claude Code", desc: "IDE-native agent with full repo context", icon: Terminal },
      { name: "Cursor", desc: "AI-first editor with Composer", icon: Code },
      { name: "Codex", desc: "OpenAI's coding agent", icon: GitBranch },
      { name: "GitHub Copilot", desc: "Chat & inline completions", icon: Zap },
      { name: "Windsurf", desc: "Cascade agentic flows", icon: Terminal },
      { name: "Cline", desc: "Autonomous coding assistant", icon: Code },
    ],
  },
  {
    category: "Agent Frameworks",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    items: [
      { name: "CrewAI", desc: "Role-based multi-agent crews", icon: Users },
      { name: "LangGraph", desc: "Stateful graph orchestration", icon: Network },
      { name: "AutoGen", desc: "Microsoft's multi-agent framework", icon: Users },
      { name: "OpenAI Assistants", desc: "Built-in tool use & threads", icon: Server },
      { name: "Semantic Kernel", desc: "Microsoft's AI orchestration", icon: Code },
      { name: "Haystack", desc: "RAG & agent pipelines", icon: Database },
    ],
  },
  {
    category: "LLM Providers",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    items: [
      { name: "OpenAI", desc: "GPT-4o, o1, embeddings", icon: Server },
      { name: "Anthropic", desc: "Claude 3.5 Sonnet, Haiku", icon: Terminal },
      { name: "Google", desc: "Gemini 1.5 Pro, Flash", icon: Globe },
      { name: "Mistral", desc: "Large, Medium, Small models", icon: Code },
      { name: "Groq", desc: "Ultra-fast inference", icon: Zap },
      { name: "Ollama", desc: "Local model hosting", icon: Database },
    ],
  },
  {
    category: "Infrastructure & Tools",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    items: [
      { name: "Supabase", desc: "Postgres + Auth + Realtime", icon: Database },
      { name: "Vercel", desc: "Edge functions & hosting", icon: Globe },
      { name: "Docker", desc: "Containerized agent deployments", icon: Server },
      { name: "Kubernetes", desc: "Orchestrated agent clusters", icon: Network },
      { name: "Redis", desc: "Caching & pub/sub for agents", icon: Zap },
      { name: "Telegram", desc: "Mobile agent control", icon: Users },
    ],
  },
]

export default function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 px-6 bg-[#08080a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">ECOSYSTEM</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Works With Your <span className="text-orange-500">Stack</span>
          </h2>
          <p className="text-zinc-400 font-mono text-sm max-w-xl mx-auto">
            AgentHelm sits between your agents and the brain. Any framework. Any model. Any cloud.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {integrations.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <div className={`bg-[#111] border ${category.border} p-6 rounded-xl h-full transition-all hover:border-current/50 hover:shadow-[0_0_30px_-10px]`}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.bg} ${category.border} ${category.color} shrink-0`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <h3 className={`font-mono text-lg font-bold uppercase tracking-wider ${category.color}`}>
                    {category.category}
                  </h3>
                </div>

                {/* Integration Items */}
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: catIndex * 0.1 + itemIndex * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.bg} ${category.border} ${category.color} shrink-0`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-white truncate">{item.name}</p>
                        <p className="font-mono text-xs text-zinc-500 truncate">{item.desc}</p>
                      </div>
                      <CheckCircle className={`w-4 h-4 ${category.color} opacity-0 group-hover:opacity-100 transition-opacity shrink-0`} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Universal SDK Message */}
        <motion.div
          className="mt-16 p-8 bg-gradient-to-br from-orange-950/15 to-[#111113] border border-zinc-800 rounded-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4">
            Unified SDK. Universal Compatibility.
          </h3>
          <p className="text-zinc-400 font-mono text-xs mb-6 max-w-2xl mx-auto leading-relaxed">
            AgentHelm's SDK wraps any agent framework. No vendor lock-in. Switch frameworks without rewriting your governance layer.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Python SDK", "Node.js SDK", "REST API"].map((tech) => (
              <span key={tech} className="px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-400">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}