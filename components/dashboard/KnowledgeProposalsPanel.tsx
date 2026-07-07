"use client"

import { useState, useEffect } from "react"
import { FileSignature, GitBranch, ShieldCheck, Loader2 } from "lucide-react"
import { StatusBadge } from "./StatusBadge"

interface ConflictDetail {
  type: string;
  existing_title: string;
  proposed_title: string;
}

interface Proposal {
  id: string;
  summary: string;
  author: string;
  branch: string;
  evidence_score: number;
  build_status: 'pending' | 'processing' | 'reviewing' | 'merged' | 'rejected';
  conflict_detected: boolean;
  conflict_details: ConflictDetail[] | Record<string, any>;
  rejection_reason?: string;
  created_at: string;
}

export default function KnowledgeProposalsPanel({ projectId, onResolve }: { projectId: string; onResolve?: () => void }) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  const fetchProposals = async () => {
    if (!projectId || projectId === 'default') {
      setLoading(false)
      return
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/proposals`)
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      }
    } catch (error) {
      console.error("Failed to fetch proposals", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [projectId])

  const handleResolve = async (proposalId: string, action: 'approve' | 'reject') => {
    setResolving(proposalId)

    try {
      const response = await fetch(`/api/projects/${projectId}/proposals/${proposalId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error(`Resolve failed with HTTP ${response.status}`)
      }

      // Refresh list
      await fetchProposals()
      if (onResolve) {
        onResolve()
      }
    } catch (error) {
      console.error(`${action} proposal ${proposalId} failed`, error)
    } finally {
      setResolving(null)
    }
  }

  // Parse conflict details safely
  const getConflictDetails = (proposal: Proposal): ConflictDetail[] => {
    if (!proposal.conflict_details) return []
    if (Array.isArray(proposal.conflict_details)) return proposal.conflict_details
    // If it's an object with keys, try to convert it or return empty
    return []
  }

  return (
    <div className="bg-[#111] rounded-xl border border-zinc-800 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium text-white flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-orange-500" />
          Knowledge Proposals
        </h3>
        {!loading && (
          <span className="text-xs text-zinc-500 font-mono">{proposals.length} Total</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="ml-2 text-xs text-zinc-500 font-mono">Loading proposals...</span>
        </div>
      )}

      {!loading && proposals.length === 0 && (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500 font-mono text-xs">No proposals submitted yet</p>
        </div>
      )}

      {!loading && proposals.length > 0 && (
        <div className="space-y-3">
          {proposals.map(proposal => {
            const conflicts = getConflictDetails(proposal)
            return (
              <div key={proposal.id} className={`p-4 bg-black/40 border rounded-lg transition-colors ${
                proposal.build_status === 'reviewing'
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-gray-200 line-clamp-1 flex-1 mr-3 font-mono">
                    {proposal.summary}
                  </p>
                  <StatusBadge status={proposal.build_status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 mb-2 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500/50"></span>
                    {proposal.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {proposal.branch || 'main'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Evidence: {proposal.evidence_score}%
                  </span>
                </div>

                {/* Rejection Reason */}
                {proposal.build_status === 'rejected' && proposal.rejection_reason && (
                  <div className="mt-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-2 rounded font-mono">
                    <strong>Reason:</strong> {proposal.rejection_reason}
                  </div>
                )}

                {/* Conflict Resolution UI */}
                {proposal.build_status === 'reviewing' && proposal.conflict_detected && (
                  <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                    <p className="text-xs text-amber-300 font-medium mb-2 font-mono">⚠️ Conflict Detected</p>
                    {conflicts.map((conflict, idx) => (
                      <div key={idx} className="text-xs text-zinc-400 mb-2 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400/80 line-through">{conflict.existing_title}</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-green-400/80">{conflict.proposed_title}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleResolve(proposal.id, 'approve')}
                        disabled={resolving === proposal.id}
                        className="px-3 py-1.5 bg-green-500/15 text-green-400 text-xs font-medium rounded-md hover:bg-green-500/25 transition-colors border border-green-500/20 font-mono uppercase tracking-wider"
                      >
                        Approve & Supersede
                      </button>
                      <button
                        onClick={() => handleResolve(proposal.id, 'reject')}
                        disabled={resolving === proposal.id}
                        className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-medium rounded-md hover:bg-red-500/25 transition-colors border border-red-500/20 font-mono uppercase tracking-wider"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
