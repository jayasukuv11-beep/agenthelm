import { useState, useEffect } from "react";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle, AlertCircle, PlayCircle, Loader2, Download, Bot, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TraceTimelineProps {
  agentId: string;
  plan: "free" | "indie" | "studio";
}

export function TraceTimeline({ agentId, plan }: TraceTimelineProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [traceData, setTraceData] = useState<{ tools: any[]; checks: any[]; reasoning: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data for free/test mode
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sdk/traces?agent_id=${agentId}&limit=${plan === "free" ? 5 : 50}`);
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setTasks(json.tasks || []);
      } catch (err) {
        // Fallback or handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId, plan]);

  async function loadTrace(taskId: string) {
    const res = await fetch(`/api/sdk/traces?task_id=${taskId}`);
    if (res.ok) {
      const json = await res.json();
      setSelectedTask(json.task);
      setTraceData({ 
        tools: json.tool_executions || [], 
        checks: json.checkpoints || [],
        reasoning: json.reasoning_steps || []
      });
    }
  }

  const handleDownload = () => {
    if (!selectedTask || !traceData) return;
    const dataStr = JSON.stringify({ task: selectedTask, trace: traceData }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-${selectedTask.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [replayLoading, setReplayLoading] = useState(false);

  const handleReplay = async () => {
    if (!selectedTask) return;
    setReplayLoading(true);
    try {
      const res = await fetch(`/api/sdk/replay?task_id=${selectedTask.id}`);
      if (!res.ok) throw new Error("Replay failed");
      const json = await res.json();
      const blob = new Blob([json.replay_script], { type: "text/x-python" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `replay_${selectedTask.id.slice(0, 8)}.py`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Replay download failed:", err);
    } finally {
      setReplayLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-10 bg-[#111111] rounded"></div>
      <div className="h-64 bg-[#111111] rounded"></div>
    </div>;
  }

  if (tasks.length === 0) {
    return <div className="p-8 text-center border border-[#1f2937] rounded-md text-gray-400 bg-[#0a0a0a]">
      No task runs found for this agent.
    </div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[600px]">
      {/* Sidebar: Task List */}
      <div className="w-full md:w-1/3 flex flex-col border border-[#1f2937] rounded-md bg-[#0a0a0a] overflow-hidden">
        <div className="p-3 border-b border-[#1f2937] bg-[#111111] font-medium text-white flex justify-between items-center">
          Recent Runs
          {plan === "free" && <Badge variant="outline" className="text-xs">Limit 5</Badge>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tasks.map(t => (
            <div 
              key={t.id} 
              onClick={() => loadTrace(t.id)}
              className={`p-3 border-b border-[#1f2937] cursor-pointer hover:bg-[#1a1a1a] transition-colors ${selectedTask?.id === t.id ? "bg-[#1a1a1a] border-l-2 border-l-[#10b981]" : ""}`}
            >
              <div className="font-medium text-sm text-gray-200 truncate">{t.task_description || t.title || "Unnamed Task"}</div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>{new Date(t.created_at).toLocaleTimeString()}</span>
                <span className={t.status === 'error' || t.status === 'failed' ? 'text-red-400' : 'text-green-400'}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View: Trace Waterfall */}
      <div className="w-full md:w-2/3 border border-[#1f2937] rounded-md bg-[#0a0a0a] flex flex-col">
        {!selectedTask ? (
          <div className="flex items-center justify-center flex-1 text-gray-500 text-sm">
            Select a run to view its trace
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[#1f2937] bg-[#111111] flex justify-between items-start">
              <div>
                <h3 className="text-white font-medium">{selectedTask.task_description || "Task Trace"}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>ID: {selectedTask.id.slice(0, 8)}...</span>
                  <Badge variant="outline" className={selectedTask.status === "failed" ? "border-red-500 text-red-400" : "border-green-500 text-green-400"}>
                    {selectedTask.status}
                  </Badge>
                </div>
              </div>
              {plan === "studio" ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleReplay} disabled={replayLoading} className="bg-transparent border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                    {replayLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitFork className="w-4 h-4 mr-2" />}
                    Fork / Replay
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="bg-transparent border-[#2d3748] hover:bg-[#1a1a1a]">
                    <Download className="w-4 h-4 mr-2" /> Export JSON
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-gray-500" title="Requires Studio plan">Export disabled</div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {/* Dummy Waterfall visualization */}
              <div className="space-y-3 relative">
                {traceData?.tools.map((tool, idx) => {
                  const width = Math.max(10, Math.random() * 80); // Mock duration scaling
                  let colorClass = "bg-[#10b981]"; // read
                  let icon = <Check className="w-3 h-3 text-white" />;
                  
                  if (tool.classification === "side_effect") {
                    colorClass = "bg-yellow-500";
                    icon = <PlayCircle className="w-3 h-3 text-white" />;
                  } else if (tool.classification === "irreversible") {
                    colorClass = "bg-red-500";
                    icon = <AlertTriangle className="w-3 h-3 text-white" />;
                  }

                  if (tool.status === "failed") {
                    colorClass = "bg-red-900 border border-red-500";
                    icon = <AlertCircle className="w-3 h-3 text-white" />;
                  }

                  return (
                    <div key={idx} className="relative group">
                      <div className="flex items-center text-xs mb-1 text-gray-400 justify-between">
                        <span className="font-mono">{tool.tool_name}</span>
                        <span>{(Math.random() * 2).toFixed(2)}s</span>
                      </div>
                      <div className="bg-[#1f2937] rounded-sm h-6 w-full relative overflow-hidden group-hover:bg-[#2d3748] transition-colors cursor-pointer">
                        <div 
                          className={`absolute left-0 top-0 h-full ${colorClass} flex items-center justify-end px-2`}
                          style={{ width: `${width}%` }}
                        >
                          {icon}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(traceData?.reasoning?.length ?? 0) > 0 && plan === "studio" && (
                  <div className="mt-8 border-t border-[#1f2937] pt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-400" /> Reasoning Chain Capture
                    </h4>
                    <div className="space-y-4">
                      {traceData?.reasoning?.map((step, idx) => (
                        <div key={`reason-${idx}`} className="bg-[#111111] border border-purple-500/30 rounded-md p-3 text-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-purple-400 font-mono">Step {step.step_index}</span>
                            <span className="text-xs text-gray-500">{step.latency_ms}ms · {step.model}</span>
                          </div>
                          <div className="text-gray-300 bg-[#0a0a0a] p-2 rounded text-xs mb-2 break-words">
                            {step.prompt_summary}
                          </div>
                          <div className="text-gray-400">
                            Decision: <span className="text-white">{step.decision}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {traceData?.tools.length === 0 && traceData?.reasoning?.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-8">
                    No run traces available.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
