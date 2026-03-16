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
      case 'running': return 'bg-[#10b981] text-[#022c22] border-[#10b981]';
      case 'idle': return 'bg-yellow-500 text-yellow-950 border-yellow-500';
      case 'stopped': return 'bg-gray-500 text-gray-950 border-gray-500';
      case 'error': return 'bg-red-500 text-red-950 border-red-500';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="bg-[#111111] border-[#1f2937] flex flex-col hover:border-[#2d3748] transition-colors">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#1a1a1a] border border-[#2d3748] flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs px-2 py-0 h-5 border-none font-semibold ${getStatusColor(agent.status)}`}>
                  {agent.status.toUpperCase()}
                </Badge>
                {agent.version && (
                   <span className="text-xs text-gray-500">v{agent.version}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Environment</span>
            <span className="text-gray-200 capitalize">{agent.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Last Seen</span>
            <span className="text-gray-200">
              {agent.lastPing ? formatDistanceToNow(new Date(agent.lastPing), { addSuffix: true }) : 'Never'}
            </span>
          </div>
          
          {agent.status === 'error' && agent.errorMessage && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="text-xs text-red-400 break-all">{agent.errorMessage}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-[#1f2937] gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1 bg-transparent border-[#2d3748] text-white hover:bg-[#1a1a1a] hover:text-white"
        >
          <Link href={`/dashboard/agents/${agent.id}`}>
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Link>
        </Button>
        {agent.status === 'running' ? (
           <Button variant="outline" size="sm" className="flex-1 bg-transparent border-[#2d3748] text-red-400 hover:bg-red-950 hover:text-red-400 hover:border-red-950">
             <Square className="w-4 h-4 mr-2" />
             Stop
           </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1 bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20 hover:text-[#10b981]">
            <Play className="w-4 h-4 mr-2" />
            Start
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
