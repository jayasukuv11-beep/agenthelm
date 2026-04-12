"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ChatInterfaceProps {
  agentId: string;
  userId: string;
  agentName: string;
  agentStatus: "running" | "idle" | "stopped" | "error";
}

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  source: "dashboard" | "telegram";
  created_at: string;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const SUGGESTED = [
  "What's your status?",
  "Run now",
  "Show last output",
  "How many tokens today?",
] as const;

export function ChatInterface({
  agentId,
  userId,
  agentName,
  agentStatus,
}: ChatInterfaceProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(agentStatus === "running");

  const [awaitingReply, setAwaitingReply] = useState(false);
  const awaitingSinceRef = useRef<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsOnline(agentStatus === "running");
  }, [agentStatus]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("agent_chats")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!error) {
        setMessages((data ?? []) as Message[]);
      }
    };

    load();
  }, [supabase, agentId]);

  useEffect(() => {
    const channel = supabase
      .channel("chat-" + agentId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_chats", filter: `agent_id=eq.${agentId}` },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => [...prev, next]);

          if (next.role === "agent" && awaitingSinceRef.current) {
            const created = new Date(next.created_at).getTime();
            if (created >= awaitingSinceRef.current) {
              setAwaitingReply(false);
              awaitingSinceRef.current = null;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, awaitingReply]);

  useEffect(() => {
    if (!awaitingReply) return;
    const t = setTimeout(() => {
      setAwaitingReply(false);
      awaitingSinceRef.current = null;
    }, 12_000);
    return () => clearTimeout(t);
  }, [awaitingReply]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const messageText = input.trim();
    setInput("");
    setSending(true);
    setAwaitingReply(true);
    awaitingSinceRef.current = Date.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, message: messageText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send");
      }

      if (data?.status === "auto_replied") {
        setAwaitingReply(false);
        awaitingSinceRef.current = null;
      }
    } catch (error) {
      console.error("Chat error:", error);
      setAwaitingReply(false);
      awaitingSinceRef.current = null;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-none border border-zinc-800 bg-[#0a0a0a] overflow-hidden">
      <div className="h-[calc(100vh-280px)] min-h-[520px] flex flex-col">
        {/* Header bar */}
        <div className="bg-[#111] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[16px]">🤖</span>
            <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-white truncate">{agentName}</span>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-none bg-orange-500 opacity-50"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-none bg-orange-500"></span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500 font-bold">Online</span>
              </>
            ) : (
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="inline-flex h-2 w-2 rounded-none bg-zinc-600" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Offline — AI will respond</span>
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                  Agent will receive messages when restarted
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 bg-[#0a0a0a] space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="text-4xl mb-3">🤖</div>
              <div className="text-zinc-400 font-mono text-[12px] uppercase tracking-widest font-bold">No messages yet</div>
              <div className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mt-2">Send a command to your agent</div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-none border border-zinc-800 bg-[#111] text-zinc-400 px-3 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%]")}>
                      {!isUser ? (
                        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                          {m.source === "telegram" ? "🤖 Agent via Telegram" : "🤖 Agent"}
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "px-4 py-3 text-[12px] font-mono leading-relaxed rounded-none border border-zinc-800",
                          isUser
                            ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                            : "bg-[#111] text-zinc-300"
                        )}
                      >
                        {m.content}
                      </div>
                      <div className={cn("mt-2 text-[9px] font-mono uppercase tracking-widest text-zinc-600", isUser ? "text-right" : "text-left")}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {awaitingReply ? (
                <div className="flex justify-start">
                  <div className="max-w-[75%]">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">🤖 Agent</div>
                    <div className="bg-[#111] border border-zinc-800 text-zinc-500 rounded-none px-4 py-3">
                      <span className="inline-flex gap-2 items-center">
                        <span className="h-1.5 w-1.5 rounded-none bg-orange-500 animate-pulse" />
                        <span className="h-1.5 w-1.5 rounded-none bg-orange-500 animate-pulse [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-none bg-orange-500 animate-pulse [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested commands bar (only when empty) */}
        {messages.length === 0 ? (
          <div className="border-t border-zinc-800 bg-[#0a0a0a] px-4 py-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">Try a suggested command above.</div>
          </div>
        ) : null}

        {/* Input bar */}
        <div className="bg-[#111] border-t border-zinc-800 px-4 py-3 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="SEND A COMMAND TO YOUR AGENT..."
            disabled={sending}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 resize-none bg-[#050505] text-white border border-zinc-800 rounded-none px-4 py-3 text-[12px] font-mono uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 disabled:opacity-50 transition-all min-h-[46px]"
          />

          <button
            onClick={sendMessage}
            disabled={sending || input.trim() === ""}
            className={cn(
              "rounded-none px-4 py-3 h-[46px] text-sm font-bold flex items-center justify-center transition-all border border-orange-500",
              "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white",
              (sending || input.trim() === "") && "opacity-50 cursor-not-allowed border-zinc-800 bg-transparent text-zinc-600 hover:bg-transparent hover:text-zinc-600"
            )}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-base font-bold">→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

