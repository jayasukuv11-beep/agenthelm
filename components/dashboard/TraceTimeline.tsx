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
  const [converting, setConverting] = useState(false);

  const handleConvertToEval = async () => {
    if (!selectedTask) return;
    setConverting(true);
    try {
      const res = await fetch("/api/sdk/evals/from-trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: selectedTask.id,
          agent_id: agentId,
          name: `Auto-Eval: ${selectedTask.task_description?.slice(0, 30) || selectedTask.id.slice(0, 8)}`
        })
      });
      if (res.ok) {
        // Simple success handling
        alert("Success: Trace converted to Eval Set. Check the Evals tab.");
      } else {
        throw new Error("Conversion failed");
      }
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Failed to convert trace to eval set.");
    } finally {
      setConverting(false);
    }
  };

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
      <div className="h-10 bg-[#111] border border-zinc-800 rounded-none"></div>
      <div className="h-64 bg-[#111] border border-zinc-800 rounded-none"></div>
    </div>;
  }

  if (tasks.length === 0) {
    return <div className="p-8 text-center border border-zinc-800 rounded-none text-zinc-500 bg-[#0a0a0a] font-mono text-[11px] uppercase tracking-widest">
      No task runs found for this agent.
    </div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[600px]">
      {/* Sidebar: Task List */}
      <div className="w-full md:w-1/3 flex flex-col border border-zinc-800 rounded-none bg-[#0a0a0a] overflow-hidden">
        <div className="p-3 border-b border-zinc-800 bg-[#111] font-mono text-[11px] uppercase tracking-widest font-bold text-white flex justify-between items-center">
          Recent Runs
          {plan === "free" && <Badge variant="outline" className="text-[9px] uppercase tracking-widest rounded-none border-zinc-700 bg-[#0a0a0a] text-zinc-400">Limit 5</Badge>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tasks.map(t => (
            <div 
              key={t.id} 
              onClick={() => loadTrace(t.id)}
              className={`p-4 border-b border-zinc-800 cursor-pointer hover:bg-[#111] transition-all relative ${selectedTask?.id === t.id ? "bg-[#111] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-orange-500" : ""}`}
            >
              <div className="font-mono font-bold text-[11px] uppercase tracking-widest text-white truncate">{t.task_description || t.title || "Unnamed Task"}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mt-2 flex justify-between">
                <span>{new Date(t.created_at).toLocaleTimeString()}</span>
                <span className={t.status === 'error' || t.status === 'failed' ? 'text-red-500' : 'text-orange-500'}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main View: Trace Waterfall */}
      <div className="w-full md:w-2/3 border border-zinc-800 rounded-none bg-[#0a0a0a] flex flex-col">
        {!selectedTask ? (
          <div className="flex items-center justify-center flex-1 text-zinc-500 text-[11px] font-mono uppercase tracking-widest">
            Select a run to view its trace
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-zinc-800 bg-[#111] flex justify-between items-start">
              <div>
                <h3 className="text-white font-mono font-bold text-[12px] uppercase tracking-widest">{selectedTask.task_description || "Task Trace"}</h3>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  <span>ID: {selectedTask.id.slice(0, 8)}...</span>
                  <Badge variant="outline" className={selectedTask.status === "failed" ? "border-red-500 text-red-500 rounded-none text-[9px] uppercase tracking-widest" : "border-orange-500 text-orange-500 rounded-none text-[9px] uppercase tracking-widest"}>
                    {selectedTask.status}
                  </Badge>
                </div>
              </div>
              {plan === "studio" ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleConvertToEval} 
                    disabled={converting} 
                    className="rounded-none font-mono text-[10px] uppercase tracking-widest border-emerald-500/50 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    {converting ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Check className="w-3 h-3 mr-2" />}
                    Convert to Eval
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReplay} disabled={replayLoading} className="rounded-none font-mono text-[10px] uppercase tracking-widest border-purple-500/50 text-purple-500 bg-purple-500/10 hover:bg-purple-500 hover:text-white transition-all">
                    {replayLoading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <GitFork className="w-3 h-3 mr-2" />}
                    Fork / Replay
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-none font-mono text-[10px] uppercase tracking-widest bg-transparent border-zinc-800 hover:bg-zinc-800 text-white transition-all">
                    <Download className="w-3 h-3 mr-2" /> Export JSON
                  </Button>
                </div>
              ) : (
                <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600" title="Requires Studio plan">Export disabled</div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-[#0a0a0a]">
              {/* Dummy Waterfall visualization */}
              <div className="space-y-4 relative">
                {traceData?.tools.map((tool, idx) => {
                  const width = Math.max(10, Math.random() * 80); // Mock duration scaling
                  let colorClass = "bg-orange-500"; // read
                  let icon = <Check className="w-3 h-3 text-black" />;
                  
                  if (tool.classification === "side_effect") {
                    colorClass = "bg-yellow-500";
                    icon = <PlayCircle className="w-3 h-3 text-black" />;
                  } else if (tool.classification === "irreversible") {
                    colorClass = "bg-red-500";
                    icon = <AlertTriangle className="w-3 h-3 text-black" />;
                  }

                  if (tool.status === "failed") {
                    colorClass = "bg-red-900 border border-red-500";
                    icon = <AlertCircle className="w-3 h-3 text-white" />;
                  }

                  return (
                    <div key={idx} className="relative group">
                      <div className="flex items-center text-[10px] uppercase font-mono tracking-widest mb-1 text-zinc-500 justify-between">
                        <span className="text-zinc-300">{tool.tool_name}</span>
                        <span>{(Math.random() * 2).toFixed(2)}s</span>
                      </div>
                      <div className="bg-[#111] border border-zinc-800 rounded-none h-6 w-full relative overflow-hidden group-hover:border-zinc-600 transition-colors cursor-pointer">
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
                  <div className="mt-8 border-t border-zinc-800 pt-6">
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-purple-500 mb-4 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-500" /> Reasoning Chain Capture
                    </h4>
                    <div className="space-y-4">
                      {traceData?.reasoning?.map((step, idx) => (
                         <div key={`reason-${idx}`} className="bg-[#111] border border-purple-500/30 rounded-none p-4 text-[11px] font-mono tracking-wider">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-purple-400 uppercase tracking-widest">Step {step.step_index}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{step.latency_ms}ms · {step.model}</span>
                          </div>
                          <div className="text-zinc-300 bg-[#050505] border border-zinc-800 p-3 rounded-none text-[10px] uppercase tracking-wider mb-3 break-words leading-relaxed">
                            {step.prompt_summary}
                          </div>
                          <div className="text-zinc-500 uppercase tracking-widest">
                            Decision: <span className="text-white font-bold">{step.decision}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {traceData?.tools.length === 0 && traceData?.reasoning?.length === 0 && (
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 text-center py-8">
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
