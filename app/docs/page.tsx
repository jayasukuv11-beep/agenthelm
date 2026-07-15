"use client"

import React from "react"
import { LegalPage } from "@/components/legal/LegalPage"
import { Book, Terminal, Shield, Cpu, ExternalLink } from "lucide-react"

export default function DocsPage() {
  return (
    <LegalPage title="Documentation" lastUpdated="July 15, 2026">
      <section className="space-y-6">
        <p className="text-zinc-400 font-mono leading-relaxed">
          Welcome to the AgentHelm documentation. AgentHelm provides a centralized control plane 
          and a shared **Project Brain** for your autonomous AI agents. Learn how to configure, 
          secure, and execute agent governance.
        </p>
      </section>

      <section className="mt-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
          <Terminal className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-white m-0">
            Installation & Connection
          </h2>
        </div>

        <div className="space-y-4">
          <h3 className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-widest">1. Python SDK</h3>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Install the official AgentHelm SDK from PyPI:
          </p>
          <pre className="bg-[#111] border border-zinc-800 p-4 font-mono text-xs text-orange-500 rounded-none">
            pip install agenthelm-sdk
          </pre>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Initialize and connect your agent:
          </p>
          <pre className="bg-[#111] border border-zinc-800 p-4 font-mono text-xs text-zinc-300 rounded-none overflow-x-auto">
{`from agenthelm import Agent

agent = Agent(
    key="YOUR_CONNECT_KEY",
    name="Analytics Agent",
    project="AgentHelm Platform"
)`}
          </pre>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="font-mono text-sm font-bold text-zinc-300 uppercase tracking-widest">2. Model Context Protocol (MCP)</h3>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Run the AgentHelm MCP server to expose your Project Brain to cursor, windsurf, or other MCP clients:
          </p>
          <pre className="bg-[#111] border border-zinc-800 p-4 font-mono text-xs text-orange-500 rounded-none">
            npx agenthelm-mcp --key YOUR_CONNECT_KEY
          </pre>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-white m-0">
            Governance Framework
          </h2>
        </div>
        <p className="text-xs text-zinc-400 font-mono leading-relaxed">
          AgentHelm enforces safety bounds using a classification model:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-xs text-zinc-400 font-mono">
          <li><strong>Read-Only:</strong> Actions that query state without modification are passed automatically.</li>
          <li><strong>Side Effect:</strong> Actions that modify state safely are tracked and logged with rate-limiting.</li>
          <li><strong>Irreversible:</strong> Sensitive operations (deleting data, executing shell code) hold in a pending state until approved.</li>
        </ul>
      </section>

      <section className="mt-12 p-6 bg-orange-500/5 border border-orange-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-orange-500" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Full Technical Reference</h3>
        </div>
        <p className="text-xs text-zinc-400 font-mono leading-relaxed">
          For complete API specifications, compilation lifecycle descriptions, and database schema diagrams, 
          visit our primary open-source repository readme:
        </p>
        <a 
          href="https://github.com/jayasukuv11-beep/agenthelm#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest hover:underline"
        >
          View GitHub Readme <ExternalLink className="w-3 h-3" />
        </a>
      </section>
    </LegalPage>
  )
}
