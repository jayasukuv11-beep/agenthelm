"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Inbox, Zap } from "lucide-react";
import { loadDemoData } from "@/app/actions/demo";
import { useToast } from "@/components/ui/use-toast";
import { StatCard } from "@/components/dashboard/StatCard";

interface Project {
  id: string;
  name: string;
  description: string | null;
  repo_url: string | null;
  brain_version: number;
  created_at: string;
  updated_at: string;
  stats: {
    agents: number;
    entries: number;
    pending_proposals: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);
  const { toast } = useToast();

  const handleLoadDemo = async () => {
    setDemoLoading(true);
    try {
      await loadDemoData();
      toast({
        title: "SUCCESS",
        description: "Demo data loaded. Welcome to AgentHelm!",
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

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-3xl font-black text-white tracking-tight font-mono uppercase">
            Projects
          </h1>
          <p className="text-zinc-500 mt-1 font-mono text-sm">
            Manage your AI engineering projects and their associated brains
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              alert("Create project functionality coming soon");
            }}
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 font-mono text-[12px] uppercase rounded-none gap-2"
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-3 text-zinc-400 font-mono text-sm">Loading projects...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700">
            <Inbox className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider mb-2">
            No Projects Yet
          </h3>
          <p className="text-zinc-500 font-mono text-sm mb-6 max-w-md">
            Create your first project to start building a Project Brain, or load demo data to explore the platform.
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

      {/* Projects Grid */}
      {!loading && projects.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Projects"
              value={projects.length}
              icon={Brain}
            />
            <StatCard
              label="Total Agents"
              value={projects.reduce((sum, p) => sum + p.stats.agents, 0)}
              icon={Brain}
            />
            <StatCard
              label="Knowledge Entries"
              value={projects.reduce((sum, p) => sum + p.stats.entries, 0)}
              icon={Brain}
            />
            <StatCard
              label="Pending Proposals"
              value={projects.reduce((sum, p) => sum + p.stats.pending_proposals, 0)}
              icon={Brain}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Brain className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-zinc-400 text-sm">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-500">
                    <div>
                      <span className="font-bold">Brain Version:</span> v{project.brain_version}
                    </div>
                    <div>
                      <span className="font-bold">Knowledge Entries:</span> {project.stats.entries.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-bold">Active Agents:</span> {project.stats.agents}
                    </div>
                    <div>
                      <span className="font-bold">Pending:</span> {project.stats.pending_proposals}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/brain?project=${project.id}`}
                      className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-mono text-xs uppercase"
                    >
                      Open Project
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}