"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Loader2, Inbox, Zap, Trash2, AlertTriangle } from "lucide-react";
import { loadDemoData } from "@/app/actions/demo";
import { deleteProject } from "@/app/actions/project";
import { useToast } from "@/components/ui/use-toast";
import { StatCard } from "@/components/dashboard/StatCard";
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

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const result = await deleteProject(deleteTarget.id);
      if (result.success) {
        toast({
          title: "PROJECT DELETED",
          description: `"${deleteTarget.name}" and all associated data have been permanently removed.`,
        });
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        setDeleteConfirmText("");
        // Remove from local state immediately
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      } else {
        toast({
          title: "DELETION FAILED",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "ERROR",
        description: err.message || "Failed to delete project.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

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

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/brain?project=${project.id}`}
                      className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-mono text-xs uppercase"
                    >
                      Open Project
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget(project);
                        setDeleteConfirmText("");
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 border-zinc-800 hover:border-red-500/30 font-mono text-xs uppercase px-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-[#111] border-zinc-800 text-white sm:max-w-md rounded-none border-t-2 border-t-red-600">
          <DialogHeader>
            <DialogTitle className="font-mono text-base uppercase tracking-widest text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Project Permanently
            </DialogTitle>
            <DialogDescription className="font-mono text-xs uppercase tracking-wider text-zinc-500 pt-1">
              This action is irreversible. All brain versions, knowledge entries, proposals, and timeline events will be permanently destroyed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4 font-mono text-xs">
            <div className="bg-red-500/5 border border-red-500/20 p-4 text-red-400/80 uppercase tracking-wider leading-relaxed">
              You are about to delete <span className="font-bold text-red-400">&quot;{deleteTarget?.name}&quot;</span> and all of its associated data. This cannot be undone.
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                Type the project name to confirm:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget?.name || ""}
                className="bg-[#0a0a0a] border-zinc-800 text-white font-mono text-xs rounded-none focus:border-red-500 h-10"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="bg-transparent border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs uppercase tracking-widest rounded-none h-10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteProject}
              disabled={deleteConfirmText !== deleteTarget?.name || deleteLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-mono text-xs uppercase tracking-widest rounded-none h-10 gap-2"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}