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
    <div className="rounded-lg border border-[#1f2937] bg-[#0a0a0a] overflow-hidden">
      <div className="h-[calc(100vh-280px)] min-h-[520px] flex flex-col">
        {/* Header bar */}
        <div className="bg-[#111111] border-b border-[#1f2937] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-white truncate">{agentName}</span>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                </span>
                <span className="text-sm text-green-400">Online</span>
              </>
            ) : (
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="inline-flex h-2 w-2 rounded-full bg-gray-500" />
                  <span className="text-sm text-gray-400">Offline — AI will respond</span>
                </div>
                <div className="text-[11px] text-gray-500">
                  Agent will receive messages when restarted
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 bg-[#0a0a0a] space-y-3"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="text-4xl mb-3">🤖</div>
              <div className="text-gray-400 font-medium">No messages yet</div>
              <div className="text-gray-500 text-sm mt-1">Send a command to your agent</div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-full bg-[#1f2937] text-[#9ca3af] px-3 py-1 text-xs hover:bg-gray-700 transition-colors"
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
                        <div className="text-xs text-gray-500 mb-1">
                          {m.source === "telegram" ? "🤖 Agent via Telegram" : "🤖 Agent"}
                        </div>
                      ) : null}
                      <div
                        className={cn(
                          "px-4 py-2 text-sm leading-relaxed",
                          isUser
                            ? "bg-[#10b981] text-white rounded-[18px_18px_4px_18px]"
                            : "bg-[#1f2937] text-[#f9fafb] rounded-[18px_18px_18px_4px]"
                        )}
                      >
                        {m.content}
                      </div>
                      <div className={cn("mt-1 text-xs text-gray-500", isUser ? "text-right" : "text-left")}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {awaitingReply ? (
                <div className="flex justify-start">
                  <div className="max-w-[75%]">
                    <div className="text-xs text-gray-500 mb-1">🤖 Agent</div>
                    <div className="bg-[#1f2937] text-[#f9fafb] rounded-[18px_18px_18px_4px] px-4 py-2">
                      <span className="inline-flex gap-1 items-center text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse [animation-delay:300ms]" />
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
          <div className="border-t border-[#1f2937] bg-[#0a0a0a] px-4 py-2">
            <div className="text-xs text-gray-500">Try a suggested command above.</div>
          </div>
        ) : null}

        {/* Input bar */}
        <div className="bg-[#111111] border-t border-[#1f2937] px-4 py-3 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a command to your agent..."
            disabled={sending}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 resize-none bg-[#1f2937] text-white border border-[#374151] rounded-xl px-4 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500 disabled:opacity-50"
          />

          <button
            onClick={sendMessage}
            disabled={sending || input.trim() === ""}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium flex items-center justify-center",
              "bg-[#10b981] text-white hover:bg-[#059669]",
              (sending || input.trim() === "") && "opacity-50 cursor-not-allowed hover:bg-[#10b981]"
            )}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-base">→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

