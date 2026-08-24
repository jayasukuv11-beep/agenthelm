"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, BookOpen, Terminal, Zap, GitBranch, Check, Copy } from "lucide-react"

const docSections = [
  {
    name: "Getting Started",
    icon: Zap,
    color: "text-vermilion",
    href: "/docs",
    items: [
      "Quickstart installation",
      "Connect connection keys",
      "Submit first proposal",
      "Expose context timeline"
    ],
  },
  {
    name: "Project Brain",
    icon: BookOpen,
    color: "text-vermilion",
    href: "/docs",
    items: [
      "Brain entry categories",
      "Knowledge integration flow",
      "Pipeline stage checks",
      "Merge planning rules"
    ],
  },
  {
    name: "SDK Reference",
    icon: Terminal,
    color: "text-vermilion",
    href: "/docs",
    items: [
      "Python SDK integration",
      "Node.js SDK integration",
      "REST JSON API routes",
      "Context injection rules"
    ],
  },
  {
    name: "Governance",
    icon: GitBranch,
    color: "text-vermilion",
    href: "/docs",
    items: [
      "Tool scopes decorators",
      "Side effect logging",
      "Irreversible actions queue",
      "Human-in-the-loop approvals"
    ],
  },
]

const codeExamples = [
  {
    lang: "Python",
    icon: Terminal,
    color: "text-vermilion",
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
    color: "text-vermilion",
    code: `// npm install agenthelm-node-sdk
const { AgentHelm } = require('agenthelm-node-sdk')

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
    color: "text-vermilion",
    code: `# Submit proposal
curl -X POST https://api.agenthelm.online/api/sdk/proposals \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
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
curl -X POST https://api.agenthelm.online/api/sdk/inject \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project": "my-project",
    "task_hint": "Optimize slow query"
  }'
`,
  },
]

export default function DocumentationCTA() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <section id="docs" className="py-24 px-6 bg-paper-dim/40 border-y border-line">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-vermilion uppercase tracking-[0.3em] block mb-3">DOCUMENTATION</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-ink mb-4">
            Start Building in <span className="text-vermilion">Minutes</span>
          </h2>
          <p className="text-ink-soft text-sm max-w-xl mx-auto">
            Explore standard guides, integration specs, and copy-paste examples to wire up your agents.
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
                className="block p-6 bg-paper-card border border-line rounded-2xl hover:border-ink-soft transition-all h-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-vermilion-soft border border-vermilion/20 flex items-center justify-center text-vermilion">
                    <section.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink">
                    {section.name}
                  </h3>
                </div>
                <ul className="space-y-2 mb-6">
                  {section.items.map((item) => (
                    <li key={item} className="text-[10px] text-muted group-hover:text-ink-soft transition-colors flex items-center gap-2">
                      <span className="w-1 h-1 bg-line rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-1.5 text-vermilion font-mono text-[10px] font-bold uppercase tracking-widest group-hover:gap-2.5 transition-all">
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
          <h3 className="font-display text-lg font-bold text-ink uppercase tracking-wider mb-6 text-center">
            Copy-Paste Quickstarts
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {codeExamples.map((example, i) => (
              <div key={example.lang} className="group">
                <div className="bg-paper-card border border-line rounded-2xl overflow-hidden hover:border-ink-soft transition-colors h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-line-soft bg-paper-dim/60">
                      <div className="flex items-center gap-2">
                        <example.icon className={`w-4 h-4 ${example.color}`} />
                        <span className="font-mono text-xs font-bold text-ink uppercase tracking-wider">{example.lang}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(example.code, i)}
                        className="text-muted hover:text-vermilion transition-colors p-1"
                        title="Copy code snippet"
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-moss" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto max-h-72 bg-[#08080a] font-mono text-[11px] leading-relaxed text-zinc-300">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          className="mt-20 p-10 md:p-16 bg-vermilion-soft border border-vermilion/20 rounded-2xl text-center relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative z-10">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-ink uppercase tracking-wider mb-4">
              Ready to build your Project Brain?
            </h3>
            <p className="text-ink-soft text-xs mb-8 max-w-xl mx-auto uppercase tracking-widest leading-relaxed">
              Start free forever for up to 3 agents · Integrate in 5 minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-vermilion hover:bg-vermilion-dark text-white font-mono font-bold text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 rounded-lg"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="border border-line text-ink-soft hover:text-ink hover:border-ink-soft font-mono text-sm px-8 py-4 transition-all flex items-center justify-center gap-2 rounded-lg"
              >
                Read Full Docs <BookOpen className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
