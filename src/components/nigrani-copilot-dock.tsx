"use client";

import React, { useState } from "react";
import {
  Bot,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Minus,
  Send,
  Sparkles,
  X,
  ShieldCheck,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";

interface CopilotProps {
  activeProjectId?: string | null;
  onOpenProject?: (id: string) => void;
}

interface Message {
  role: "user" | "copilot";
  text: string;
  confidence?: number;
  citations?: Array<{ id: string; type: string; date: string }>;
  timestamp: string;
}

export function NigraniCopilotDock({ activeProjectId, onOpenProject }: CopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "copilot",
      text: "Namaste. I am **NIGRANI Copilot**, grounded in the active MPLADS public-development dataset.\n\nYou can ask about risk signals, satellite observations, missing documents, or financial vs progress anomalies.",
      confidence: 98,
      citations: [{ id: "NIGRANI-SYS", type: "Grounded AI Engine", date: "2026-03" }],
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const quickPrompts = activeProjectId
    ? [
        `Why is ${activeProjectId} flagged as high risk?`,
        `Show Copernicus Sentinel-2 observation for ${activeProjectId}`,
        `What citizen verification reports exist for ${activeProjectId}?`,
        `Compare expenditure and reported physical progress`,
      ]
    : [
        "Which district has the highest verification backlog?",
        "Why is NIG-DEMO-001 high risk?",
        "Explain the 2x2 Decision Framework Matrix",
        "How is satellite observation corroborated with ground inspection?",
      ];

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, projectId: activeProjectId }),
      });
      const data = await res.json();

      const botMsg: Message = {
        role: "copilot",
        text: data.answer || "Insufficient evidence available in the active database to answer this question.",
        confidence: data.confidence || 85,
        citations: data.citations || [],
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: "An error occurred while connecting to the grounded intelligence model. Please retry.",
          confidence: 0,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-[#1646d8] via-[#7c3aed] to-[#ff9933] text-white shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 border-2 border-white/20 group"
        aria-label="Open NIGRANI AI Copilot"
      >
        <BrainCircuit size={20} className="animate-pulse" />
        <span className="font-bold text-xs tracking-wide">NIGRANI COPILOT</span>
        <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-semibold">AI</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
        isMinimized ? "h-14" : "h-[540px]"
      }`}
    >
      {/* Copilot Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-sky-500 flex items-center justify-center text-white shadow-md">
            <BrainCircuit size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              NIGRANI Grounded Copilot
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800">
                EVIDENCE-LINKED
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {activeProjectId ? `Context: ${activeProjectId}` : "Nationwide MPLADS Intelligence Corpus"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <ChevronUp size={16} /> : <Minus size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/60 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm shadow-md"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-sm"
                  }`}
                >
                  {m.text}

                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5 text-[9px] font-mono text-sky-300">
                      {m.citations.map((c, cIdx) => (
                        <span key={cIdx} className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                          📌 {c.id} ({c.type})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-sky-400 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 w-fit">
                <Loader2 size={14} className="animate-spin" />
                <span>Synthesizing evidence trail & querying risk engine...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 bg-slate-950/80 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {quickPrompts.slice(0, 2).map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              >
                ⚡ {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask NIGRANI Copilot about money, evidence or satellite..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition"
              aria-label="Send query"
            >
              <Send size={15} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
