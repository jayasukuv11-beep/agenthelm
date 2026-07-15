"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, Search, FileText, CheckCircle, Clock, User, Copy, GitBranch, Brain, Inbox, Zap, Loader2, GitCommit } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TechnicalLabel } from "@/components/dashboard/TechnicalLabel";
import { StatCard } from "@/components/dashboard/StatCard";
import KnowledgeProposalsPanel from "@/components/dashboard/KnowledgeProposalsPanel";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
}

interface BrainEntry {
  id: string;
  category: string;
  title: string;
  content: {
    description?: string;
    [key: string]: any;
  };
  status: string;
  tags: string[];
  source_type: string;
  source_path: string | null;
  confidence: number;
  created_at: string;
}

function KnowledgeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [entries, setEntries] = useState<BrainEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Blame history states
  const [connectKey, setConnectKey] = useState<string>("");
  const [blameModalOpen, setBlameModalOpen] = useState(false);
  const [blameLoading, setBlameLoading] = useState(false);
  const [blameEntryTitle, setBlameEntryTitle] = useState("");
  const [blameEntryCategory, setBlameEntryCategory] = useState("");
  const [blameHistory, setBlameHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('connect_key')
          .eq('id', session.user.id)
          .single();
        if (profile?.connect_key) {
          setConnectKey(profile.connect_key);
        }
      }
    }
    loadProfile();
  }, [supabase]);

  // Load all projects on mount
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

  // Load brain entries for the selected project
  const fetchEntries = async () => {
    if (!selectedProjectId) return;
    setLoadingEntries(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/brain/entries?status=all&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    router.push(`/dashboard/knowledge?project=${projId}`);
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

  const handleViewBlame = async (category: string, title: string) => {
    setBlameEntryTitle(title);
    setBlameEntryCategory(category);
    setBlameModalOpen(true);
    setBlameLoading(true);
    setBlameHistory([]);
    try {
      const res = await fetch("/api/sdk/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "blame",
          project: selectedProjectId,
          category,
          title,
          key: connectKey
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBlameHistory(data.entries || []);
      } else {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error || "Failed to fetch blame timeline",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to query history",
        variant: "destructive"
      });
    } finally {
      setBlameLoading(false);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const searchLower = search.toLowerCase();
    const titleMatch = entry.title.toLowerCase().includes(searchLower);
    const categoryMatch = entry.category.toLowerCase().includes(searchLower);
    const descMatch = (entry.content?.description || "").toLowerCase().includes(searchLower);
    const tagMatch = entry.tags?.some((t) => t.toLowerCase().includes(searchLower)) || false;
    return titleMatch || categoryMatch || descMatch || tagMatch;
  });

  const getEntryDescription = (entry: BrainEntry) => {
    return entry.content?.description || JSON.stringify(entry.content);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Knowledge Base
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Shared project knowledge and decisions
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
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none gap-2"
          >
            New Entry
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
            Please create a project or load demo data to view the Knowledge Base.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="bg-[#111] border border-zinc-800 rounded-xl p-4">
              <div className="relative">
                <Input
                  placeholder="Search knowledge entries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10 bg-[#0a0a0a] border-zinc-800 rounded-none font-mono text-zinc-300"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              </div>
              <p className="mt-2 text-xs text-zinc-500 font-mono">
                {filteredEntries.length} of {entries.length} entries shown
              </p>
            </div>

            {/* Loading Entries State */}
            {loadingEntries && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span className="ml-2 text-xs text-zinc-500 font-mono">Loading entries...</span>
              </div>
            )}

            {/* Knowledge Entries List */}
            {!loadingEntries && (
              <div className="space-y-4">
                {filteredEntries.length > 0 ? (
                  filteredEntries.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors"
                    >
                      <div className="bg-[#0a0a0a] border-b border-zinc-800 px-4 py-3 flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                            {entry.title}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-400 font-mono">
                            {getEntryDescription(entry)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-mono rounded ${
                                entry.status === "active"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {entry.status.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-mono bg-zinc-800/50 rounded text-zinc-400">
                              {entry.category}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-mono bg-zinc-800/50 rounded text-zinc-400">
                              {entry.confidence}% Confidence
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(entry.content, null, 2));
                              toast({ title: "Copied", description: "Entry content copied to clipboard" });
                            }}
                            aria-label="Copy Entry Content"
                            className="p-1.5 bg-[#111] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors rounded"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleViewBlame(entry.category, entry.title)}
                            aria-label="View Version Blame History"
                            className="p-1.5 bg-[#111] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 font-mono text-[10px] uppercase font-bold rounded"
                          >
                            <GitCommit className="w-3.5 h-3.5" /> Blame
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-[#111]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-zinc-500">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-orange-400" />
                            <span className="truncate">
                              Source: {entry.source_path || entry.source_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-400" />
                            <span>Type: {entry.source_type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-400" />
                            <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-[#111] border border-zinc-800 rounded-xl">
                    <p className="text-zinc-500 font-mono text-sm">
                      No knowledge entries match your search
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <KnowledgeProposalsPanel
              projectId={selectedProjectId}
              onResolve={fetchEntries}
            />

            <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
              <TechnicalLabel className="block mb-4">Knowledge Stats</TechnicalLabel>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total"
                  value={entries.length.toString()}
                  description="All entries"
                />
                <StatCard
                  label="Active"
                  value={entries.filter((e) => e.status === "active").length.toString()}
                  description="Current"
                />
                <StatCard
                  label="Deprecated"
                  value={entries.filter((e) => e.status === "deprecated").length.toString()}
                  description="Outdated"
                />
                <StatCard
                  label="Categories"
                  value={new Set(entries.map((e) => e.category)).size.toString()}
                  description="Unique areas"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Blame History Modal */}
      <Dialog open={blameModalOpen} onOpenChange={setBlameModalOpen}>
        <DialogContent className="bg-[#111] border-zinc-800 text-white sm:max-w-2xl rounded-none border-t-2 border-t-orange-500 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-mono text-base uppercase tracking-widest text-white flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-orange-500" />
              Lineage Blame: [{blameEntryCategory}] {blameEntryTitle}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider text-zinc-500 pt-1">
              Historical lineage and compiler trace for this entry
            </DialogDescription>
          </DialogHeader>

          {blameLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Tracing version lineage...</span>
            </div>
          ) : (
            <div className="space-y-6 py-4 font-mono text-xs">
              {blameHistory.length === 0 ? (
                <div className="text-center py-6 border border-zinc-800 text-zinc-500 uppercase tracking-wider">
                  No blame timeline history found.
                </div>
              ) : (
                <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-8">
                  {blameHistory.map((item: any, i: number) => (
                    <div key={i} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[34px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500/10 border border-orange-500 text-[10px] text-orange-500 font-bold">
                        {i + 1}
                      </span>
                      
                      <div className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[11px] font-bold text-orange-500 uppercase">Version v{item.brain_versions?.version || i + 1}</span>
                            <span className="mx-2 text-zinc-700">|</span>
                            <span className="text-[10px] text-zinc-500 uppercase">{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] rounded uppercase font-bold ${
                            item.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>{item.status}</span>
                        </div>
                        
                        <div className="text-[11px] text-zinc-400 uppercase tracking-wider">
                          <span className="text-zinc-600 font-bold">Evolution:</span> {item.brain_versions?.evolution_reason || "Initial proposal merge"}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 uppercase">
                          <div>Source: <span className="text-zinc-400">{item.source_path || "Unknown"}</span></div>
                          <div>Agent Type: <span className="text-zinc-400">{item.source_type}</span></div>
                        </div>

                        <pre className="text-[10px] text-zinc-400 bg-black/50 p-3 overflow-x-auto whitespace-pre-wrap rounded">
                          {JSON.stringify(item.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-zinc-800 pt-4">
            <Button 
              onClick={() => setBlameModalOpen(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs uppercase tracking-widest rounded-none h-10 px-6"
            >
              Close Blame
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto p-6">
        <div className="h-24 bg-[#111] border border-zinc-800"></div>
        <div className="h-64 bg-[#111] border border-zinc-800"></div>
      </div>
    }>
      <KnowledgeContent />
    </Suspense>
  );
}
