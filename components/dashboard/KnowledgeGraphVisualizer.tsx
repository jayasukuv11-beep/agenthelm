"use client";

import React, { useState } from "react";
import { Brain, Database, Server, ShieldCheck, FileCode, GitBranch, Layers, CheckCircle2, RefreshCw } from "lucide-react";

interface NodeItem {
  id: string;
  label: string;
  category: "version" | "architecture" | "database" | "apis" | "decisions" | "standards";
  x: number;
  y: number;
  entriesCount: number;
  status: "active" | "synced" | "building";
}

interface EdgeItem {
  from: string;
  to: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: any }> = {
  version: { bg: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-400", icon: GitBranch },
  architecture: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-400", icon: Layers },
  database: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", icon: Database },
  apis: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", icon: Server },
  decisions: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", icon: ShieldCheck },
  standards: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-400", icon: FileCode },
};

export default function KnowledgeGraphVisualizer({
  latestVersion = 1,
  totalEntries = 0,
  categoryCounts = {}
}: {
  latestVersion?: number;
  totalEntries?: number;
  categoryCounts?: Record<string, number>;
}) {
  const [selectedNode, setSelectedNode] = useState<NodeItem | null>(null);

  // Layout Nodes around a central Brain Core
  const nodes: NodeItem[] = [
    {
      id: "root-brain",
      label: `Project Brain v${latestVersion}`,
      category: "version",
      x: 350,
      y: 180,
      entriesCount: totalEntries,
      status: "synced"
    },
    {
      id: "cat-arch",
      label: "Architecture",
      category: "architecture",
      x: 150,
      y: 80,
      entriesCount: categoryCounts["architecture"] || 4,
      status: "active"
    },
    {
      id: "cat-db",
      label: "Database Schemas",
      category: "database",
      x: 550,
      y: 80,
      entriesCount: categoryCounts["database"] || 3,
      status: "active"
    },
    {
      id: "cat-api",
      label: "API Specs & Contracts",
      category: "apis",
      x: 120,
      y: 280,
      entriesCount: categoryCounts["apis"] || 5,
      status: "active"
    },
    {
      id: "cat-decisions",
      label: "Engineering Decisions",
      category: "decisions",
      x: 580,
      y: 280,
      entriesCount: categoryCounts["decisions"] || 6,
      status: "active"
    },
    {
      id: "cat-standards",
      label: "Standards & Governance",
      category: "standards",
      x: 350,
      y: 330,
      entriesCount: categoryCounts["standards"] || 2,
      status: "active"
    }
  ];

  const edges: EdgeItem[] = [
    { from: "root-brain", to: "cat-arch" },
    { from: "root-brain", to: "cat-db" },
    { from: "root-brain", to: "cat-api" },
    { from: "root-brain", to: "cat-decisions" },
    { from: "root-brain", to: "cat-standards" },
    { from: "cat-arch", to: "cat-decisions" },
    { from: "cat-db", to: "cat-api" }
  ];

  const getNode = (id: string) => nodes.find(n => n.id === id);

  return (
    <div className="bg-[#111] border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Project Brain Knowledge Graph
          </h3>
          <p className="text-zinc-500 font-mono text-xs mt-0.5">
            Interactive visual graph mapping compiled knowledge nodes and dependencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Compiler Active
          </span>
        </div>
      </div>

      <div className="h-[400px] w-full bg-[#0a0a0c] border border-zinc-800/80 rounded-xl relative overflow-hidden flex items-center justify-center">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* SVG Edges Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 700 380">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {edges.map((edge, idx) => {
            const n1 = getNode(edge.from);
            const n2 = getNode(edge.to);
            if (!n1 || !n2) return null;
            return (
              <line
                key={idx}
                x1={n1.x}
                y1={n1.y}
                x2={n2.x}
                y2={n2.y}
                stroke="url(#edgeGrad)"
                strokeWidth="1.5"
                strokeDasharray={edge.from === "root-brain" ? "none" : "4 4"}
              />
            );
          })}
        </svg>

        {/* Node Components */}
        <div className="absolute inset-0">
          {nodes.map(node => {
            const config = CATEGORY_COLORS[node.category];
            const Icon = config.icon;
            const isSelected = selectedNode?.id === node.id;

            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ left: `${node.x - 75}px`, top: `${node.y - 30}px` }}
                className={`absolute w-[150px] p-2.5 rounded-lg border text-left transition-all duration-200 backdrop-blur-md cursor-pointer ${config.bg} ${config.border} ${
                  isSelected ? "ring-2 ring-indigo-400 scale-105 shadow-lg shadow-indigo-500/20" : "hover:scale-102"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${config.text}`} />
                    <span className="font-mono text-xs font-bold text-white truncate">{node.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{node.entriesCount} entries</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Drawer / Info */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-[#0a0a0c] border border-zinc-800 rounded-lg flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-white font-bold">{selectedNode.label}</span>
              <span className="text-zinc-500 ml-2">({selectedNode.entriesCount} entries, Category: {selectedNode.category})</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-zinc-500 hover:text-white uppercase font-bold text-[10px]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
