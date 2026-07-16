"use client"

import { useState, useEffect } from "react"
import { Copy, Check, GitBranch, Cpu, ArrowRight } from "lucide-react"

const tabData = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    desc: "Configure Claude Desktop to read/write to the Project Brain automatically.",
    code: `{
  "mcpServers": {
    "agenthelm": {
      "command": "npx",
      "args": ["-y", "agenthelm-mcp"],
      "env": {
        "AGENTHELM_CONNECT_KEY": "ahe_live_...",
        "AGENTHELM_PROJECT": "my-production-app",
        "AGENTHELM_BASE_URL": "https://api.agenthelm.online"
      }
    }
  }
}`
  },
  {
    id: "cursor",
    name: "Cursor / Windsurf",
    desc: "Add AgentHelm as a custom MCP server in Cursor settings.",
    code: `Name: agenthelm
Type: command
Command: npx -y agenthelm-mcp

# Environment Variables:
AGENTHELM_CONNECT_KEY = "ahe_live_..."
AGENTHELM_PROJECT = "my-production-app"
AGENTHELM_BASE_URL = "https://api.agenthelm.online"`
  },
  {
    id: "cli",
    name: "Terminal",
    desc: "Interact with the Project Brain history directly using the CLI tool.",
    code: `# Run the MCP server standalone
export AGENTHELM_CONNECT_KEY="ahe_live_..."
export AGENTHELM_PROJECT="my-production-app"

npx agenthelm-mcp`
  }
]

export default function MCPSection() {
  const [activeTab, setActiveTab] = useState("claude-desktop")
  const [copied, setCopied] = useState(false)
  const [terminalLine, setTerminalLine] = useState(0)
  const [terminalText, setTerminalText] = useState<string[]>([])

  const activeCode = tabData.find(t => t.id === activeTab)?.code || ""

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Terminal Animation Sequence
  useEffect(() => {
    const lines = [
      "agenthelm get_history --action blame --file lib/auth.ts",
      "Fetching Project Brain git history...",
      "Found 3 agent commits affecting lib/auth.ts:",
      "",
      "COMMIT v3.2.1 [auth-agent] 2026-07-16 14:02:11",
      "  DECISION: Migrate JWT secrets to Vault",
      "  AFFECTED: POST /api/auth/login, POST /api/auth/refresh",
      "  REASON: Avoid credentials exposure. Stripping secrets from runtime config.",
      "",
      "COMMIT v3.0.4 [billing-agent] 2026-07-15 09:41:00",
      "  DECISION: Add Stripe webhook idempotency keys",
      "  AFFECTED: POST /api/webhook/stripe",
      "  REASON: Prevent double billing on duplicate webhook events.",
      "",
      "COMMIT v2.9.1 [refactor-agent] 2026-07-12 11:22:45",
      "  DECISION: Enforce strict typescript interface for user session",
      "  AFFECTED: lib/auth.ts",
      "  REASON: Fix runtime undefined crashes during API load spikes."
    ]

    let currentIdx = 0
    setTerminalText([])

    const interval = setInterval(() => {
      if (currentIdx < lines.length) {
        setTerminalText(prev => [...prev, lines[currentIdx]])
        currentIdx++
      } else {
        // Reset and loop after 6 seconds
        clearInterval(interval)
        setTimeout(() => {
          setTerminalText([])
          currentIdx = 0
          // Trigger effect rerun by dummy updates
          setTerminalLine(p => p + 1)
        }, 6000)
      }
    }, 450)

    return () => clearInterval(interval)
  }, [terminalLine])

  return (
    <section id="mcp" className="py-24 px-6 bg-[#08080a] border-y border-zinc-900 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono text-orange-500/60 uppercase tracking-[0.3em] block mb-3">Model Context Protocol</span>
          <h2 className="text-3xl md:text-5xl font-black font-mono uppercase tracking-tight text-white mb-4">
            Zero-Plugin setup with <span className="text-orange-500">MCP</span>
          </h2>
          <p className="text-zinc-400 font-mono text-sm max-w-2xl mx-auto">
            Expose the Project Brain directly to your IDE agents. AgentHelm is natively compatible with Claude Code, Cursor, Windsurf, and Claude Desktop using the Model Context Protocol.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column - Setup Config */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#111113] border border-zinc-800 p-6 rounded-2xl">
            <div>
              <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-500" />
                Connection Config
              </h3>
              
              {/* Tab headers */}
              <div className="flex border-b border-zinc-800 mb-6">
                {tabData.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 font-mono text-xs uppercase tracking-widest border-b-2 px-3 transition-colors ${
                      activeTab === tab.id
                        ? "border-orange-500 text-white font-bold"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>

              <p className="font-mono text-xs text-zinc-400 mb-4">
                {tabData.find(t => t.id === activeTab)?.desc}
              </p>

              {/* Code display */}
              <div className="relative bg-[#08080a] border border-zinc-800/80 rounded-xl p-4 font-mono text-xs text-zinc-300 max-h-72 overflow-y-auto">
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 text-zinc-500 hover:text-orange-500 transition-colors p-1"
                  aria-label="Copy code block"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre className="whitespace-pre overflow-x-auto text-[11px] leading-relaxed">
                  <code>{activeCode}</code>
                </pre>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-800/50">
              <a
                href="/docs"
                className="inline-flex items-center gap-2 font-mono text-xs text-orange-500 hover:text-orange-400 font-bold uppercase tracking-widest group"
              >
                Learn more in Docs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Column - The Agent Timeline Terminal (Signature Moment) */}
          <div className="lg:col-span-7 flex flex-col bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Terminal Window Header */}
            <div className="px-4 py-3 border-b border-zinc-800 bg-[#161619] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/50" />
                <span className="font-mono text-xs text-zinc-500 ml-2">agenthelm-history --blame</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-mono text-[10px] text-cyan-500 uppercase tracking-widest">project-brain:master</span>
              </div>
            </div>

            {/* Terminal Screen */}
            <div className="flex-1 p-6 font-mono text-xs bg-[#08080a] min-h-[380px] overflow-y-auto leading-relaxed relative selection:bg-orange-500/30">
              {/* Scanline pattern overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.003)_50%,rgba(0,0,0,0.05)_50%)] bg-[size:100%_4px] pointer-events-none" />
              
              <div className="space-y-1.5 text-zinc-300">
                {terminalText.map((line, idx) => {
                  const safeLine = line || ""
                  const isPrompt = safeLine.startsWith("agenthelm ")
                  const isDecision = safeLine.startsWith("  DECISION:")
                  const isAffected = safeLine.startsWith("  AFFECTED:")
                  const isReason = safeLine.startsWith("  REASON:")
                  const isHeader = safeLine.startsWith("COMMIT ")

                  let className = "text-zinc-400"
                  if (isPrompt) className = "text-cyan-400 font-bold"
                  else if (isHeader) className = "text-white border-b border-zinc-900 pb-0.5 mt-4 block"
                  else if (isDecision) className = "text-orange-400"
                  else if (isAffected) className = "text-zinc-500"
                  else if (isReason) className = "text-zinc-300 pl-4 border-l border-zinc-800"

                  return (
                    <div key={idx} className={className}>
                      {isPrompt && <span className="text-zinc-600 mr-2">$</span>}
                      {line}
                    </div>
                  )
                })}
                {/* Typing cursor */}
                <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1 align-middle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
