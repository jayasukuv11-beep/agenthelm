"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Square, Settings, AlertCircle, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface AgentCardProps {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'stopped' | 'error';
  type: string;
  version?: string;
  lastPing?: string;
  errorMessage?: string;
}

export function AgentCard({ agent }: { agent: AgentCardProps }) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-orange-500 text-black border-orange-500';
      case 'idle': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'stopped': return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      case 'error': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-zinc-800 text-white';
    }
  };

  return (
    <Card className="bg-[#111] border-zinc-800 rounded-none shadow-sm flex flex-col hover:border-zinc-600 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center">
              <Bot className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <CardTitle className="text-[14px] font-mono font-bold uppercase tracking-widest text-white">{agent.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={`text-[10px] uppercase font-mono tracking-widest px-2 py-0 h-5 rounded-none font-bold ${getStatusColor(agent.status)}`}>
                  {agent.status.toUpperCase()}
                </Badge>
                {agent.version && (
                   <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">v{agent.version}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="space-y-3 font-mono text-[11px] uppercase tracking-widest">
          <div className="flex justify-between">
            <span className="text-zinc-500">Environment</span>
            <span className="text-zinc-300 capitalize">{agent.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Last Seen</span>
            <span className="text-zinc-300">
              {agent.lastPing ? formatDistanceToNow(new Date(agent.lastPing), { addSuffix: true }) : 'Never'}
            </span>
          </div>
          
          {agent.status === 'error' && agent.errorMessage && (
            <div className="mt-4 p-3 rounded-none bg-red-500/10 border border-red-500/30 flex items-start gap-2">
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
