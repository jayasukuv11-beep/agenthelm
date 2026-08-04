"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, GitBranch, ShieldCheck, Loader2, Check, X, Inbox, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { TechnicalLabel } from "@/components/dashboard/TechnicalLabel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
}

interface Proposal {
  id: string;
  summary: string;
  decisions: any[];
  files_modified: string[];
  apis_affected: any[];
  db_changes: any[];
  known_limitations: any[];
  next_steps: any[];
  tests_passed: boolean;
  human_reviewed: boolean;
  commit_sha: string | null;
  branch: string | null;
  author: string;
  build_status: "pending" | "processing" | "reviewing" | "merged" | "rejected";
  conflict_detected: boolean;
  conflict_details: any[];
  evidence_score: number;
  rejection_reason: string | null;
  created_at: string;
}

interface ConflictDetail {
  type: string;
  existing_title: string;
  proposed_title: string;
  severity?: string;
  reason?: string;
}

function ProposalsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);

  // Real-time subscription
  useEffect(() => {
    if (!selectedProjectId) return;

    fetchProposals();

    const subscription = supabase
      .channel(`proposals-${selectedProjectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "knowledge_proposals", filter: `project_id=eq.${selectedProjectId}` },
        () => fetchProposals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedProjectId, supabase]);

  // Load projects on mount
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        const projectsList = data.projects || [];
        setProjects(projectsList);

        // Determine which project to select
        const queryProjId = searchParams.get("project");
        if (queryProjId && projectsList.some((p: Project) => p.id === queryProjId)) {
          setSelectedProjectId(queryProjId);
        } else if (projectsList.length > 0) {
          setSelectedProjectId(projectsList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchParams]);

  // Fetch proposals
  const fetchProposals = useCallback(async () => {
    if (!selectedProjectId || selectedProjectId === "default") return;
    setLoadingProposals(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error("Failed to fetch proposals", err);
    } finally {
      setLoadingProposals(false);
    }
  }, [selectedProjectId]);

  // Initial fetch when project changes
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    router.push(`/dashboard/proposals?project=${projId}`);
  };

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      await loadDemoData();
      toast({
        title: "SUCCESS",
        description: "Demo data loaded successfully!",
      });
      window.location.reload();
    } catch (error) {
      toast({
        title: "ERROR",
        description: "Failed to load demo data.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  // Parse conflict details safely
  const getConflictDetails = (proposal: Proposal): ConflictDetail[] => {
    if (!proposal.conflict_details) return [];
    if (Array.isArray(proposal.conflict_details)) return proposal.conflict_details as ConflictDetail[];
    return [];
  };

  const handleResolve = async (proposalId: string, action: "approve" | "reject") => {
    setResolving(proposalId);

    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/proposals/${proposalId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error(`Resolve failed with HTTP ${response.status}`);
      }

      // Refresh list
      await fetchProposals();
      toast({
        title: action === "approve" ? "Proposal Approved" : "Proposal Rejected",
        description: action === "approve"
          ? "Proposal has been merged into the Project Brain"
          : "Proposal has been rejected"
      });
    } catch (error) {
      console.error(`${action} proposal ${proposalId} failed`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} proposal`,
        variant: "destructive"
      });
    } finally {
      setResolving(null);
    }
  };

  // Stats
  const pendingCount = proposals.filter(p => p.build_status === "pending").length;
  const reviewingCount = proposals.filter(p => p.build_status === "reviewing").length;
  const mergedCount = proposals.filter(p => p.build_status === "merged").length;
  const rejectedCount = proposals.filter(p => p.build_status === "rejected").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Proposals
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Knowledge proposals awaiting review or merged into the Project Brain
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={handleProjectChange}
              className="px-3 py-2 bg-[#111] border border-zinc-800 text-white font-mono text-sm focus:ring-1 focus:ring-orange-500 outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            onClick={fetchProposals}
            disabled={loadingProposals}
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none gap-2"
          >
            <GitBranch className="w-4 h-4" />
            REFRESH
          </Button>
        </div>
      </div>

      {loadingProjects && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-3 text-zinc-400 font-mono text-sm">Loading projects...</span>
        </div>
      )}

      {!loadingProjects && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700">
            <Inbox className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider mb-2">
            No Projects Found
          </h3>
          <p className="text-zinc-500 font-mono text-sm mb-6 max-w-md">
            Please create a project or load demo data to view proposals.
          </p>
          <Button
            onClick={handleLoadDemo}
            disabled={demoLoading}
            className="bg-orange-500 hover:bg-orange-600 text-black font-mono uppercase text-xs tracking-wider gap-2"
          >
            {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Load Demo Data
          </Button>
        </div>
      )}

      {!loadingProjects && projects.length > 0 && selectedProjectId && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Pending"
              value={pendingCount.toString()}
              description="Awaiting processing"
            />
            <StatCard
              label="Reviewing"
              value={reviewingCount.toString()}
              description="Needs human approval"
            />
            <StatCard
              label="Merged"
              value={mergedCount.toString()}
              description="Compiled into Brain"
            />
            <StatCard
              label="Rejected"
              value={rejectedCount.toString()}
              description="Declined proposals"
            />
          </div>

          {/* Proposals List */}
          <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <TechnicalLabel className="block">Knowledge Proposals</TechnicalLabel>
              {!loadingProposals && (
                <span className="text-xs text-zinc-500 font-mono">{proposals.length} Total</span>
              )}
            </div>

            {loadingProposals && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span className="ml-2 text-xs text-zinc-500 font-mono">Loading proposals...</span>
              </div>
            )}

            {!loadingProposals && proposals.length === 0 && (
              <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-500 font-mono text-xs">No proposals submitted yet</p>
              </div>
            )}

            {!loadingProposals && proposals.length > 0 && (
              <div className="space-y-3">
                {proposals.map((proposal) => {
                  const conflicts = getConflictDetails(proposal);
                  return (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 bg-black/40 border rounded-lg transition-colors ${
                        proposal.build_status === "reviewing"
                          ? "border-amber-500/30 hover:border-amber-500/50"
                          : proposal.build_status === "pending"
                          ? "border-blue-500/30 hover:border-blue-500/50"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-gray-200 line-clamp-1 flex-1 mr-3 font-mono">
                          {proposal.summary}
                        </p>
                        <StatusBadge status={proposal.build_status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mb-2 font-mono">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500/50"></span>
                          {proposal.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          {proposal.branch || "main"}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Evidence: {proposal.evidence_score}%
                        </span>
                        <span className="flex items-center gap-1">
                          {proposal.tests_passed ? (
                            <span className="text-green-400">✓ Tests passed</span>
                          ) : (
                            <span className="text-zinc-600">✗ Tests unknown</span>
                          )}
                        </span>
                        {proposal.human_reviewed && (
                          <span className="flex items-center gap-1 text-green-400">
                            <Check className="w-3 h-3" />
                            Human reviewed
                          </span>
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {proposal.build_status === "rejected" && proposal.rejection_reason && (
                        <div className="mt-2 text-xs text-red-400 bg-red-500/5 border border-red-500/10 p-2 rounded font-mono">
                          <strong>Reason:</strong> {proposal.rejection_reason}
                        </div>
                      )}

                      {/* Conflict Resolution & Human Approval UI */}
                      {proposal.build_status === "reviewing" && (
                        <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                          <p className="text-xs text-amber-300 font-medium mb-2 font-mono flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            {proposal.conflict_detected ? "Conflict Detected" : "Review Required"}
                          </p>
                          {conflicts.map((conflict, idx) => (
                            <div key={idx} className="text-xs text-zinc-400 mb-2 font-mono">
                              <div className="flex items-center gap-2">
                                {conflict.severity === "high" && (
                                  <span className="text-red-400/80 text-[8px] bg-red-500/10 px-1.5 py-0.5 rounded">HIGH</span>
                                )}
                                <span className="text-red-400/80 line-through">{conflict.existing_title}</span>
                                <span className="text-zinc-600">→</span>
                                <span className="text-green-400/80">{conflict.proposed_title}</span>
                              </div>
                              {conflict.reason && (
                                <div className="ml-6 text-[10px] text-zinc-500">{conflict.reason}</div>
                              )}
                            </div>
                          ))}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleResolve(proposal.id, "approve")}
                              disabled={resolving === proposal.id}
                              className="px-3 py-1.5 bg-green-500/15 text-green-400 text-xs font-medium rounded-md hover:bg-green-500/25 transition-colors border border-green-500/20 font-mono uppercase tracking-wider flex items-center gap-1"
                            >
                              {resolving === proposal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Approve & Compile
                            </button>
                            <button
                              onClick={() => handleResolve(proposal.id, "reject")}
                              disabled={resolving === proposal.id}
                              className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-medium rounded-md hover:bg-red-500/25 transition-colors border border-red-500/20 font-mono uppercase tracking-wider flex items-center gap-1"
                            >
                              {resolving === proposal.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Proposal Details Expandable */}
                      <details className="mt-3">
                        <summary className="flex items-center gap-2 text-xs text-zinc-500 font-mono cursor-pointer hover:text-zinc-400">
                          <GitBranch className="w-3 h-3" />
                          Details
                        </summary>
                        <div className="mt-3 p-3 bg-[#0a0a0a] border border-zinc-800 rounded-lg space-y-2 text-xs font-mono text-zinc-400">
                          {proposal.decisions && proposal.decisions.length > 0 && (
                            <div>
                              <div className="text-orange-400 mb-1">Decisions:</div>
                              {proposal.decisions.map((d: any, i: number) => (
                                <div key={i} className="ml-3 text-zinc-400">• {d.title || JSON.stringify(d)}</div>
                              ))}
                            </div>
                          )}
                          {proposal.apis_affected && proposal.apis_affected.length > 0 && (
                            <div>
                              <div className="text-blue-400 mb-1">APIs Affected:</div>
                              {proposal.apis_affected.map((a: any, i: number) => (
                                <div key={i} className="ml-3 text-zinc-400">• {a.endpoint || JSON.stringify(a)}</div>
                              ))}
                            </div>
                          )}
                          {proposal.db_changes && proposal.db_changes.length > 0 && (
                            <div>
                              <div className="text-purple-400 mb-1">DB Changes:</div>
                              {proposal.db_changes.map((d: any, i: number) => (
                                <div key={i} className="ml-3 text-zinc-400">• {d.table || JSON.stringify(d)}</div>
                              ))}
                            </div>
                          )}
                          {proposal.files_modified && proposal.files_modified.length > 0 && (
                            <div>
                              <div className="text-yellow-400 mb-1">Files Modified:</div>
                              {proposal.files_modified.map((f: string, i: number) => (
                                <div key={i} className="ml-3 text-zinc-400">• {f}</div>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-zinc-800">
                            <span>Created:</span>
                            <span className="text-white">{new Date(proposal.created_at).toLocaleString()}</span>
                          </div>
                          {proposal.commit_sha && (
                            <div className="flex justify-between">
                              <span>Commit:</span>
                              <span className="text-white font-mono text-[10px]">{proposal.commit_sha.substring(0, 8)}</span>
                            </div>
                          )}
                        </div>
                      </details>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto p-6">
        <div className="h-24 bg-[#111] border border-zinc-800"></div>
        <div className="h-64 bg-[#111] border border-zinc-800"></div>
      </div>
    }>
      <ProposalsContent />
    </Suspense>
  );
}