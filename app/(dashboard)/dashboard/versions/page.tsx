"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GitBranch, Clock, CheckCircle, XCircle, Brain, FileText, User, Inbox, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { TechnicalLabel } from "@/components/dashboard/TechnicalLabel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
}

interface BrainVersion {
  id: string;
  version: number;
  parent_version: number | null;
  evolution_reason: string;
  built_from_proposals: string[] | null;
  files_changed_count: number;
  apis_changed_count: number;
  entries_added_count: number;
  entries_deprecated_count: number;
  evidence_summary: any;
  created_at: string;
}

function VersionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [versions, setVersions] = useState<BrainVersion[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Comparison State
  const [vBaseline, setVBaseline] = useState<string>("");
  const [vComparison, setVComparison] = useState<string>("");

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

  // Load brain versions
  const fetchVersions = async () => {
    if (!selectedProjectId) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/versions`);
      if (res.ok) {
        const data = await res.json();
        const list = data.versions || [];
        setVersions(list);

        if (list.length > 0) {
          setVComparison(list[0].version.toString());
          if (list.length > 1) {
            setVBaseline(list[1].version.toString());
          } else {
            setVBaseline(list[0].version.toString());
          }
        }
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [selectedProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    router.push(`/dashboard/versions?project=${projId}`);
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

  const activeVersion = versions[0];
  const baselineObj = versions.find((v) => v.version.toString() === vBaseline);
  const comparisonObj = versions.find((v) => v.version.toString() === vComparison);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Brain Versions
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Version history of your Project Brain
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

          <button
            onClick={fetchVersions}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-mono text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-zinc-800 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            Refresh Timeline
          </button>
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
            Please create a project or load demo data to view version rollbacks and diffs.
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
          {/* Version Stats */}
          {activeVersion && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Latest Release"
                value={`v${activeVersion.version}`}
                description="Current compiled version"
              />
              <StatCard
                label="Files Modified"
                value={activeVersion.files_changed_count}
                description="Total files in delta"
              />
              <StatCard
                label="APIs Changed"
                value={activeVersion.apis_changed_count}
                description="Endpoints compiled"
              />
              <StatCard
                label="Confidence Index"
                value={activeVersion.evidence_summary?.confidence ? `${activeVersion.evidence_summary.confidence}%` : "100%"}
                description="Compiler safety assurance"
              />
            </div>
          )}

          {/* Timeline */}
          <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
            <TechnicalLabel className="block mb-6">Version Timeline</TechnicalLabel>

            {loadingVersions && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span className="ml-2 text-xs text-zinc-500 font-mono">Loading version history...</span>
              </div>
            )}

            {!loadingVersions && versions.length === 0 && (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-500 font-mono text-sm">No compiled versions found for this project</p>
              </div>
            )}

            {!loadingVersions && versions.length > 0 && (
              <div className="space-y-6">
                {versions.map((version, idx) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-zinc-800 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10 border border-orange-500/30 text-orange-500 shadow-[0_0_15px_-5px_rgba(255,87,34,0.3)]">
                          <GitBranch className="w-6 h-6" />
                        </div>
                        <span className="mt-2 text-[10px] font-mono text-orange-500 uppercase tracking-widest font-bold">
                          v{version.version}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-mono text-xl font-bold text-white uppercase tracking-tight">
                            v{version.version}
                          </h3>
                          <StatusBadge status={idx === 0 ? "active" : "superseded"} />
                        </div>

                        <p className="text-sm font-mono text-zinc-400">
                          {version.evolution_reason}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-[#0a0a0a] border border-zinc-800 p-3 rounded-lg">
                            <TechnicalLabel variant="muted" className="block mb-2">Knowledge Delta</TechnicalLabel>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Added:</span>
                                <span className="text-green-400 font-bold">+{version.entries_added_count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Deprecated:</span>
                                <span className="text-orange-400 font-bold">-{version.entries_deprecated_count}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0a0a0a] border border-zinc-800 p-3 rounded-lg">
                            <TechnicalLabel variant="muted" className="block mb-2">Changes</TechnicalLabel>
                            <div className="grid grid-cols-1 gap-1 text-xs font-mono text-zinc-400">
                              <div className="flex justify-between">
                                <span>Files modified:</span>
                                <span className="text-white font-bold">{version.files_changed_count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>APIs affected:</span>
                                <span className="text-white font-bold">{version.apis_changed_count}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#0a0a0a] border border-zinc-800 p-3 rounded-lg">
                            <TechnicalLabel variant="muted" className="block mb-2">Metadata</TechnicalLabel>
                            <div className="space-y-1 text-xs font-mono text-zinc-400">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-purple-400" />
                                <span>{new Date(version.created_at).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-blue-400" />
                                <span>System Compiler</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {version.built_from_proposals && version.built_from_proposals.length > 0 && (
                          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4">
                            <TechnicalLabel className="block mb-3 text-zinc-400">Merged Proposals</TechnicalLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {version.built_from_proposals.map((propId) => (
                                <div key={propId} className="flex items-center gap-3 p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
                                  <FileText className="w-3 h-3 text-orange-500" />
                                  <span className="truncate flex-1">{propId}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                          <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-xs font-mono uppercase tracking-wider transition-all">
                            View Diff
                          </button>
                          <button className="px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 rounded-lg text-xs font-mono uppercase tracking-wider transition-all">
                            Rollback
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Comparison Section */}
          {versions.length > 0 && (
            <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
              <TechnicalLabel className="block mb-6">Version Comparison</TechnicalLabel>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <select
                  value={vBaseline}
                  onChange={(e) => setVBaseline(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-zinc-800 text-zinc-400 font-mono text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} {v.version === activeVersion.version ? "(current)" : ""}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-600 font-mono text-xs uppercase tracking-widest">vs</span>
                <select
                  value={vComparison}
                  onChange={(e) => setVComparison(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-zinc-800 text-zinc-400 font-mono text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} {v.version === activeVersion.version ? "(current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-[#0a0a0a] border border-zinc-800 p-6 rounded-xl space-y-4">
                  <h3 className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-wider">
                    Baseline (v{vBaseline})
                  </h3>
                  {baselineObj ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between p-2 border-b border-zinc-900">
                        <span>Reason</span>
                        <span className="text-white truncate max-w-xs">{baselineObj.evolution_reason}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-zinc-900">
                        <span>Files Changed</span>
                        <span className="text-blue-400">{baselineObj.files_changed_count}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-zinc-900">
                        <span>APIs Affected</span>
                        <span className="text-blue-400">{baselineObj.apis_changed_count}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono">No baseline selected</p>
                  )}
                </div>

                <div className="bg-[#0a0a0a] border border-orange-500/20 p-6 rounded-xl space-y-4 shadow-[0_0_20px_-10px_rgba(255,87,34,0.2)]">
                  <h3 className="font-mono text-sm font-bold text-orange-500 uppercase tracking-wider">
                    Comparison (v{vComparison})
                  </h3>
                  {comparisonObj ? (
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between p-2 border-b border-zinc-900">
                        <span>Reason</span>
                        <span className="text-white truncate max-w-xs">{comparisonObj.evolution_reason}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-zinc-900">
                        <span>Files Changed</span>
                        <span className="text-green-400 font-bold">{comparisonObj.files_changed_count}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-zinc-900">
                        <span>APIs Affected</span>
                        <span className="text-green-400 font-bold">{comparisonObj.apis_changed_count}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 font-mono">No comparison selected</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function VersionsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto p-6">
        <div className="h-24 bg-[#111] border border-zinc-800"></div>
        <div className="h-64 bg-[#111] border border-zinc-800"></div>
      </div>
    }>
      <VersionsContent />
    </Suspense>
  );
}
