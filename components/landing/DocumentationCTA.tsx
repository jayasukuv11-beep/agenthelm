"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, BookOpen, Terminal, Zap, GitBranch, ExternalLink } from "lucide-react"

const docSections = [
  {
    name: "Getting Started",
    icon: Zap,
    color: "text-orange-500",
    href: "/docs/getting-started",
    items: [
      "Quickstart (5 min)",
      "Install SDK",
      "Connect first agent",
      "Submit first proposal",
    ],
  },
  {
    name: "Project Brain",
    icon: BookOpen,
    color: "text-blue-500",
    href: "/docs/project-brain",
    items: [
      "Brain health metrics",
      "Knowledge categories",
      "Pipeline visualization",
      "Version history",
    ],
  },
  {
    name: "SDK Reference",
    icon: Terminal,
    color: "text-green-500",
    href: "/docs/sdk",
    items: [
      "Python SDK",
      "Node.js SDK",
      "REST API",
      "Context injection",
    ],
  },
  {
    name: "Security",
    icon: GitBranch,
    color: "text-purple-500",
    href: "/docs/security",
    items: [
      "Replay protection",
      "Context sanitization",
      "Permission model",
      "Audit logs",
    ],
  },
]

const codeExamples = [
  {
    lang: "Python",
    icon: Terminal,
    color: "text-blue-500",
    code: `# pip install agenthelm-sdk
import agenthelm

dock = agenthelm.connect(
    "ahe_live_...",
    name="research-agent"
)

# Submit knowledge proposal
dock.propose(
    summary="Added user auth module",
    decisions=["JWT with refresh tokens"],
    files_modified=["auth/jwt.py", "auth/models.py"],
    apis_affected=["POST /auth/login"],
)

# Inject context for a task
context = dock.inject(
    project="my-project",
    task_hint="Implement password reset"
)
`,
  },
  {
    lang: "Node.js",
    icon: Zap,
    color: "text-green-500",
    code: `// npm install agenthelm-sdk
const { AgentHelm } = require('agenthelm-sdk')

const dock = new AgentHelm("ahe_live_...", {
  name: "payment-agent"
})

// Submit knowledge proposal
await dock.propose({
  summary: "Stripe webhook handler",
  decisions: ["Idempotency keys required"],
  files_modified: ["payments/webhook.js"],
  apis_affected: ["POST /webhooks/stripe"],
})

// Inject context
const context = await dock.inject({
  project: "my-project",
  task_hint: "Handle subscription cancellation"
})
`,
  },
  {
    lang: "cURL (REST)",
    icon: GitBranch,
    color: "text-orange-500",
    code: `# Submit proposal
curl -X POST https://api.agenthelm.online/api/sdk/proposals \
  -H "Authorization: Bearer ahe_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "project": "my-project",
    "content_hash": "abc123...",
    "payload": {
      "summary": "Database migration v3",
      "decisions": ["Add idx on user_email"],
      "db_changes": ["ALTER TABLE users ADD INDEX..."]
    }
  }'

# Inject context
curl -X POST https://api.agenthelm.online/api/sdk/inject \
  -H "Authorization: Bearer ahe_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "project": "my-project",
    "task_hint": "Optimize slow query"
  }'
`,
  },
]

export default function DocumentationCTA() {
  return (
    <section id="docs" className="py-20 px-6 bg-[#0a0a0a] border-y border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">DOCUMENTATION</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Start Building in <span className="text-orange-500">Minutes</span>
          </h2>
          <p className="text-zinc-500 font-mono text-sm max-w-xl mx-auto">
            Complete guides, API reference, and copy-paste examples for every integration.
          </p>
        </div>

        {/* Doc Sections */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {docSections.map((section, i) => (
            <motion.div
              key={section.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <Link
                href={section.href}
                className="block p-6 bg-[#111] border border-zinc-800 rounded-xl hover:border-zinc-700 hover:shadow-[0_0_30px_-10px_rgba(255,87,34,0.2)] transition-all h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-current/10 border border-current/30 ${section.color}`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h3 className={`font-mono text-lg font-bold uppercase tracking-wider ${section.color}`}>
                    {section.name}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="font-mono text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center gap-1 text-orange-500 font-mono text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                  <ArrowRight className="w-4 h-4" />
                  Read Guide
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-wider mb-6 text-center">
            Copy-Paste Examples
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {codeExamples.map((example, i) => (
              <div key={example.lang} className="group">
                <div className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                      <example.icon className={`w-4 h-4 ${example.color}`} />
                      <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">{example.lang}</span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-orange-500 transition-colors p-1">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto max-h-72">
                    <code className="font-mono text-xs text-zinc-300 leading-relaxed block">{example.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          className="mt-16 p-10 md:p-16 bg-gradient-to-br from-orange-950/30 via-purple-950/30 to-[#0a0a0a] border border-orange-500/30 rounded-2xl text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,87,34,0.1),transparent_70%)]" />
          <div className="relative z-10">
            <h3 className="font-mono text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-4">
              Ready to Build Your Project Brain?
            </h3>
            <p className="text-zinc-400 font-mono text-sm mb-8 max-w-xl mx-auto">
              Free forever for up to 3 agents. No credit card. Deploy in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,87,34,0.4)]"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800/50 font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2"
              >
                Read Full Docs <BookOpen className="w-4 h-4" />
              </Link>
            </div>
            <p className="mt-6 text-zinc-600 text-[11px] font-mono uppercase tracking-widest">
              No credit card · Free forever · Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}