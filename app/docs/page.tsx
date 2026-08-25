"use client"

import React from "react"
import { LegalPage } from "@/components/legal/LegalPage"
import { Terminal, Shield, Book, ExternalLink } from "lucide-react"

export default function DocsPage() {
  return (
    <LegalPage title="Developer Documentation" lastUpdated="July 15, 2026">
      <section className="space-y-4">
        <p className="text-muted leading-relaxed">
          AgentHelm is a control plane for autonomous agents. Connect any Python or
          TypeScript agent to govern how it retrieves knowledge, proposes changes,
          and executes agent governance.
        </p>
      </section>

      <section className="mt-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-line pb-2">
          <Terminal className="w-5 h-5 text-vermilion" />
          <h2 className="text-xl font-bold font-display tracking-tight text-ink m-0">
            Installation &amp; Connection
          </h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">1. Python SDK</h3>
          <p className="text-sm text-muted leading-relaxed">
            Install the official AgentHelm SDK from PyPI:
          </p>
          <pre className="bg-[#1a1a1a] border border-line p-4 font-mono text-xs text-zinc-200 rounded-xl overflow-x-auto">
{`pip install agenthelm-sdk`}
          </pre>
          <p className="text-sm text-muted leading-relaxed">
            Initialize and connect your agent:
          </p>
          <pre className="bg-[#1a1a1a] border border-line p-4 font-mono text-xs text-zinc-200 rounded-xl overflow-x-auto">
{`from agenthelm import Agent

agent = Agent(
    key="YOUR_CONNECT_KEY",
    name="Analytics Agent",
    project="AgentHelm Platform"
)`}
          </pre>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-semibold text-ink">2. Model Context Protocol (MCP)</h3>
          <p className="text-sm text-muted leading-relaxed">
            Plug AgentHelm into Cursor, Claude Code, or Claude Desktop by adding the MCP server configuration:
          </p>
          <pre className="bg-[#1a1a1a] border border-line p-4 font-mono text-xs text-zinc-200 rounded-xl overflow-x-auto">
{`{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "YOUR_CONNECT_KEY",
        "AGENTHELM_PROJECT": "my-project-name"
      }
    }
  }
}`}
          </pre>
          <p className="text-sm text-muted leading-relaxed">
            Exposes tools: <code className="text-vermilion">get_context</code>, <code className="text-vermilion">propose_knowledge</code>, and <code className="text-vermilion">get_history</code>.
          </p>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="flex items-center gap-3 border-b border-line pb-2">
          <Shield className="w-5 h-5 text-vermilion" />
          <h2 className="text-xl font-bold font-display tracking-tight text-ink m-0">
            Governance Framework
          </h2>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          AgentHelm enforces safety bounds using a classification model:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted">
          <li><strong className="text-ink">Read-Only:</strong> Actions that query state without modification are passed automatically.</li>
          <li><strong className="text-ink">Side Effect:</strong> Actions that modify state safely are tracked and logged with rate-limiting.</li>
          <li><strong className="text-ink">Irreversible:</strong> Sensitive operations (deleting data, executing shell code) hold in a pending state until approved.</li>
        </ul>
      </section>

      <section className="mt-12 p-6 bg-vermilion-soft border border-vermilion/20 space-y-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-vermilion" />
          <h3 className="text-sm font-semibold text-ink">Full Technical Reference</h3>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          For complete API specifications, compilation lifecycle descriptions, and database schema diagrams,
          visit our primary open-source repository readme:
        </p>
        <a
          href="https://github.com/jayasukuv11-beep/agenthelm#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-vermilion hover:text-vermilion-dark font-semibold hover:underline"
        >
          View GitHub Readme <ExternalLink className="w-3 h-3" />
        </a>
      </section>
    </LegalPage>
  )
}
