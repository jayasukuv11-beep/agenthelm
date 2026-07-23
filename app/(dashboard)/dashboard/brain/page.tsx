"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Brain, GitBranch, Server, Database, Zap, FileText, Search, Inbox, Loader2 } from "lucide-react";
import ProjectBrainPanel from "@/components/dashboard/ProjectBrainPanel";
import KnowledgeGraphVisualizer from "@/components/dashboard/KnowledgeGraphVisualizer";
import { StatCard } from "@/components/dashboard/StatCard";
import { TechnicalLabel } from "@/components/dashboard/TechnicalLabel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
}

interface ProjectHealthData {
  health: {
    quality_score: number;
    trust_score: number;
    average_confidence: number;
    latest_version: number;
    last_updated: string | null;
    coverage: {
      architecture: boolean;
      decisions: boolean;
      database: boolean;
      apis: boolean;
    };
  };
  stats: {
    total_entries: number;
    category_breakdown: Record<string, number>;
  };
}

function ProjectBrainContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [healthData, setHealthData] = useState<ProjectHealthData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

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

  // Load project health stats
  const fetchProjectHealth = async () => {
    if (!selectedProjectId) return;
    setLoadingHealth(true);
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err) {
      console.error("Failed to load project health:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchProjectHealth();
  }, [selectedProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    router.push(`/dashboard/brain?project=${projId}`);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    router.push(`/dashboard/knowledge?project=${selectedProjectId}&search=${encodeURIComponent(searchQuery)}`);
  };

  // Safe category count extractor
  const getCategoryCount = (catName: string) => {
    if (!healthData?.stats?.category_breakdown) return 0;
    return healthData.stats.category_breakdown[catName.toLowerCase()] || 0;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight font-mono uppercase">
            Project Brain
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Shared knowledge base for your AI engineering projects
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
            onClick={fetchProjectHealth}
            variant="outline"
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none gap-2"
          >
            <GitBranch className="w-4 h-4" />
            Refresh Brain
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
            Please create a project or load demo data to view the Project Brain compiler.
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
          {/* Core Health Panel */}
          <ProjectBrainPanel projectId={selectedProjectId} />

          {/* Brain Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Quality Score"
              value={healthData ? `${healthData.health.quality_score}%` : "—"}
              description="Overall knowledge quality"
            />
            <StatCard
              label="Latest Version"
              value={healthData ? `v${healthData.health.latest_version}` : "—"}
              description="Current brain release"
            />
            <StatCard
              label="Knowledge Entries"
              value={healthData ? healthData.stats.total_entries.toString() : "—"}
              description="Total documented items"
            />
            <StatCard
              label="Trust Index"
              value={healthData ? `${healthData.health.trust_score}%` : "—"}
              description="Verified source reliability"
            />
          </div>

          {/* Knowledge Categories */}
          <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
            <TechnicalLabel className="block mb-4">Knowledge Categories</TechnicalLabel>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Architecture", desc: "System design, patterns, decisions", key: "architecture" },
                { name: "Database", desc: "Schemas, migrations, queries", key: "database" },
                { name: "APIs", desc: "Endpoints, contracts, versions", key: "apis" },
                { name: "Decisions", desc: "Architectural and product decisions", key: "decisions" },
                { name: "Standards", desc: "Code formatting and validation rules", key: "standards" },
                { name: "Goals", desc: "Feature roadmaps and milestone scopes", key: "goals" },
              ].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => router.push(`/dashboard/knowledge?project=${selectedProjectId}&category=${cat.key}`)}
                  className="bg-[#0a0a0a] border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors group cursor-pointer"
                >
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2 group-hover:text-orange-500 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mb-3">{cat.desc}</p>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <span className="w-2 h-2 bg-orange-500/40 rounded-full" />
                    {getCategoryCount(cat.key)} entries
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Interface */}
          <form onSubmit={handleSearchSubmit} className="bg-[#111] border border-zinc-800 rounded-xl p-6">
            <TechnicalLabel className="block mb-4">Search Knowledge</TechnicalLabel>
            <div className="relative">
              <Input
                placeholder="Search by keyword, filename, decision, or agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 bg-[#0a0a0a] border-zinc-800 rounded-none text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500 font-mono">
              Query the Project Brain using natural language or technical identifiers.
            </p>
          </form>

          {/* Interactive Knowledge Graph */}
          <KnowledgeGraphVisualizer
            latestVersion={healthData?.health.latest_version}
            totalEntries={healthData?.stats.total_entries}
            categoryCounts={healthData?.stats.category_breakdown}
          />
        </>
      )}
    </div>
  );
}

export default function ProjectBrainPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto p-6">
        <div className="h-24 bg-[#111] border border-zinc-800"></div>
        <div className="h-64 bg-[#111] border border-zinc-800"></div>
      </div>
    }>
      <ProjectBrainContent />
    </Suspense>
  );
}
