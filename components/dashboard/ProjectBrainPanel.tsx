"use client"

import { useState, useEffect } from "react"
import { Brain, ShieldCheck, Database, Server, AlertTriangle, GitMerge } from "lucide-react"
import { StatCard } from "./StatCard"
import { TechnicalLabel } from "./TechnicalLabel"

interface ProjectBrainHealth {
  health: {
    quality_score: number
    trust_score: number
    latest_version: number
    average_confidence: number
    latest_delta: {
      added: number
      deprecated: number
      files_changed: number
    }
    coverage: {
      architecture: boolean
      decisions: boolean
      database: boolean
      apis: boolean
    }
    action_items: string[]
  }
}

export default function ProjectBrainPanel({ projectId }: { projectId: string }) {
  const [health, setHealth] = useState<ProjectBrainHealth | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/health`)
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error("Failed to load project health", err))
  }, [projectId])

  if (!health) {
    return <div className="p-6 text-sm text-zinc-500 font-mono animate-pulse">Loading Project Brain...</div>
  }

  const { quality_score, trust_score, latest_version, average_confidence, latest_delta, coverage, action_items } = health.health

  return (
    <div className="bg-[#111] rounded-xl border border-zinc-800 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-orange-500" />
          Project Brain
        </h3>
        <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-semibold uppercase tracking-wider rounded-full border border-orange-500/20 font-mono">
          v{latest_version}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Quality Score"
          value={`${quality_score}/100`}
          description="Overall knowledge quality"
        />
        <StatCard
          label="Avg Confidence"
          value={`${average_confidence}%`}
          description="Mean confidence of entries"
        />
        <StatCard
          label="Trust Score"
          value={`${trust_score}%`}
          description="Verified source reliability"
        />
        <StatCard
          label="Latest Compile"
          value={`${latest_delta.added} Added`}
          description={`${latest_delta.deprecated} deprecated`}
          icon={GitMerge}
        />
      </div>

      {action_items.length > 0 && (
        <div className="mb-6 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <TechnicalLabel variant="accent" className="text-amber-300">Needs Attention</TechnicalLabel>
          </div>
          <div className="space-y-1">
            {action_items.slice(0, 3).map((item) => (
              <p key={item} className="text-xs text-zinc-400 font-mono">{item}</p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <TechnicalLabel>Context Coverage</TechnicalLabel>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-300 font-mono">Architecture & Decisions</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-md font-mono ${coverage.architecture ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {coverage.architecture ? 'Mapped' : 'Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Server className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-300 font-mono">API Specifications</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-md font-mono ${coverage.apis ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {coverage.apis ? 'Mapped' : 'Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-zinc-800/50">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-300 font-mono">Database Schema</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-md font-mono ${coverage.database ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {coverage.database ? 'Mapped' : 'Missing'}
          </span>
        </div>
      </div>
    </div>
  )
}
