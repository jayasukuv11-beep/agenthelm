"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Square, Settings, AlertCircle, Bot, Folder, Zap, GitBranch, FileText, Clock, Activity, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export interface AgentDetailCardProps {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'stopped' | 'error';
  type: string;
  version?: string;
  lastPing?: string;
  errorMessage?: string;
  // Project Brain fields
  currentProject?: string;
  lastContextInjection?: string;
  tokensInjected?: number;
  brainVersion?: string;
  currentTask?: string;
  publishedProposals?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-orange-500 text-black border-orange-500';
    case 'idle': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
    case 'stopped': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    case 'error': return 'bg-red-500/20 text-red-500 border-red-500/50';
    default: return 'bg-zinc-800 text-white';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <Activity className="w-3 h-3" />;
    case 'idle': return <Clock className="w-3 h-3" />;
    case 'stopped': return <Square className="w-3 h-3" />;
    case 'error': return <AlertCircle className="w-3 h-3" />;
    default: return <Bot className="w-3 h-3" />;
  }
};

export function AgentDetailCard({ agent }: { agent: AgentDetailCardProps }) {
  const lastSeen = agent.lastPing ? formatDistanceToNow(new Date(agent.lastPing), { addSuffix: true }) : 'Never';
  const injectionTime = agent.lastContextInjection ? formatDistanceToNow(new Date(agent.lastContextInjection), { addSuffix: true }) : 'Never';

  return (
    <Card className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-zinc-600 transition-colors hover:shadow-[0_0_20px_-5px_rgba(255,87,34,0.3)]">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <CardTitle className="text-[14px] font-mono font-bold uppercase tracking-widest text-white">{agent.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`text-[10px] uppercase font-mono tracking-widest px-2 py-0 h-5 rounded-none font-bold ${getStatusColor(agent.status)} flex items-center gap-1`}>
                  {getStatusIcon(agent.status)}
                  {agent.status.toUpperCase()}
                </Badge>
                {agent.version && (
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">v{agent.version}</span>
                )}
                {agent.type && (
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-widest px-2 py-0 h-5 rounded-none bg-zinc-800/50 border-zinc-700 text-zinc-400">
                    {agent.type.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="space-y-4 font-mono text-[11px] uppercase tracking-widest">
          {/* Current Project */}
          {agent.currentProject && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Folder className="w-3 h-3" />
                <span>Current Project</span>
              </div>
              <p className="text-white font-medium pl-5">{agent.currentProject}</p>
            </div>
          )}

          {/* Last Context Injection */}
          {agent.lastContextInjection && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Zap className="w-3 h-3" />
                <span>Last Context Injection</span>
              </div>
              <div className="flex items-center gap-4 pl-5 text-white">
                <span>{injectionTime}</span>
                {agent.tokensInjected && (
                  <span className="flex items-center gap-1 text-orange-500">
                    <Activity className="w-3 h-3" />
                    {agent.tokensInjected.toLocaleString()} tokens
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Brain Version */}
          {agent.brainVersion && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <GitBranch className="w-3 h-3" />
                <span>Brain Version</span>
              </div>
              <p className="text-orange-500 font-bold pl-5">{agent.brainVersion}</p>
            </div>
          )}

          {/* Current Task */}
          {agent.currentTask && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <FileText className="w-3 h-3" />
                <span>Current Task</span>
              </div>
              <p className="text-zinc-300 pl-5 line-clamp-2">{agent.currentTask}</p>
            </div>
          )}

          {/* Published Proposals */}
          {agent.publishedProposals !== undefined && agent.publishedProposals > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <FileText className="w-3 h-3" />
                <span>Published Proposals</span>
              </div>
              <div className="pl-5">
                <Link
                  href={`/dashboard/knowledge?agent=${agent.id}`}
                  className="text-orange-500 hover:text-orange-400 flex items-center gap-1 font-mono text-sm underline-offset-2"
                >
                  <span>{agent.publishedProposals}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Last Seen */}
          <div className="flex justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-500">Last Seen</span>
            <span className="text-zinc-300">{lastSeen}</span>
          </div>

          {agent.status === 'error' && agent.errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="text-[10px] font-mono text-red-400 break-all leading-relaxed">{agent.errorMessage}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-zinc-800 gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1 rounded-none bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-all"
        >
          <Link href={`/dashboard/agents/${agent.id}`}>
            <Settings className="w-3 h-3 mr-2" />
            Manage
          </Link>
        </Button>
        {agent.status === 'running' ? (
           <Button variant="outline" size="sm" className="flex-1 rounded-none bg-transparent border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 font-mono text-[10px] uppercase tracking-widest transition-all">
             <Square className="w-3 h-3 mr-2" />
             Stop
           </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1 rounded-none bg-orange-500/10 border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-all">
            <Play className="w-3 h-3 mr-2" />
            Start
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}