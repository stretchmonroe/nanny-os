"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUp, Loader2 } from "lucide-react";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";
import { recentMemories } from "@/lib/data/demo";
import SproutResultActions from "./SproutResultActions";
import type { MemoryEvent } from "@/lib/data/demo";

// ── Static data ───────────────────────────────────────────────────────────────

const EXAMPLES = [
  "Water play this week",
  "Foods introduced recently",
  "Language milestones",
  "Last time at the park",
  "Nap patterns",
  "Big moments from May",
];

// Compact string sent to AI — built once at module load
const MEMORY_INDEX = recentMemories
  .map((m) => `${m.id}|${m.date}|${m.time}|${m.type}|${m.category}|${m.content}`)
  .join("\n");

const ENTRY_MAP: Record<string, MemoryEvent> = Object.fromEntries(
  recentMemories.map((m) => [m.id, m])
);

const TYPE_ICON: Record<string, string> = { photo: "📷", milestone: "⭐", note: "📝" };

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  matchIds:    string[];
  summary:     string;
  timeContext: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MemorySearchPane() {
  const [query,     setQuery]     = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<SearchResult | null>(null);
  const { activeChild } = useAppStore();

  const canSearch = query.trim().length > 0;

  function clear() {
    setQuery("");
    setResult(null);
    setSubmitted("");
  }

  async function search(q?: string) {
    const text = (q ?? query).trim();
    if (!text || loading) return;
    setQuery(text);
    setSubmitted(text);
    setLoading(true);
    setResult(null);

    const res = await callAI("memorySearch", {
      query:       text,
      childName:   activeChild.name,
      childAge:    activeChild.age,
      memoryIndex: MEMORY_INDEX,
    });

    setLoading(false);
    if (!res) return;

    const parsed = parseAIJson<Partial<SearchResult>>(res.result, {});
    setResult({
      matchIds:    Array.isArray(parsed.matchIds) ? parsed.matchIds.filter((id) => id in ENTRY_MAP) : [],
      summary:     parsed.summary     ?? "Couldn't find anything for that. Try rephrasing.",
      timeContext: parsed.timeContext  ?? null,
    });
  }

  const matches = result?.matchIds.map((id) => ENTRY_MAP[id]).filter(Boolean) ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Input */}
      <div className="px-5 mb-4 shrink-0">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canSearch) search(); }}
            placeholder="Ask about Mateo's history…"
            className="flex-1 text-[14px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic font-medium"
          />
          {query && (
            <button onClick={clear} className="shrink-0 active:opacity-70">
              <X size={12} className="text-muted-foreground/40" />
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => search()}
            disabled={!canSearch || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
            style={{ background: canSearch && !loading ? "var(--sage)" : "var(--border-medium)" }}
          >
            {loading
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <ArrowUp size={14} className="text-white" strokeWidth={2.5} />
            }
          </motion.button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">

          {/* Default state — example chips */}
          {!result && !loading && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="px-5"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3">
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setQuery(s); search(s); }}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                    style={{
                      background: "var(--surface-card)",
                      color:      "var(--foreground)",
                      border:     "1.5px solid var(--border-soft)",
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-5 py-12 flex flex-col items-center gap-3"
            >
              <motion.span
                className="text-[28px] leading-none select-none"
                animate={{ rotate: [0, 10, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                🌱
              </motion.span>
              <p className="text-[13px] text-muted-foreground/45 italic">
                Searching Mateo&apos;s memory…
              </p>
            </motion.div>
          )}

          {/* Results */}
          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.25, 1, 0.5, 1] }}
              className="pb-4"
            >
              {/* Summary */}
              <div className="px-5 mb-5">
                {result.timeContext && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
                    {result.timeContext}
                  </p>
                )}
                <p className="text-[15px] text-foreground/80 leading-relaxed font-medium">
                  {result.summary}
                </p>
              </div>

              {/* Matched entries — staggered entrance */}
              {matches.length > 0 && (
                <div className="space-y-1.5 px-5">
                  {matches.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                      whileTap={{ scale: 0.985 }}
                      className="flex items-start gap-3 rounded-2xl px-4 py-3"
                      style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)" }}
                    >
                      <span className="text-[14px] leading-none mt-0.5 shrink-0">
                        {TYPE_ICON[m.type] ?? "📝"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-foreground/80 leading-snug">{m.content}</p>
                        <p className="text-[10px] text-muted-foreground/40 mt-1 font-medium">
                          {m.date} · {m.time}
                        </p>
                      </div>
                      {m.isFavorite && (
                        <span className="text-[12px] shrink-0 mt-0.5 opacity-70">❤️</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky action bar — only when a result is present */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          >
            <SproutResultActions resetKey={submitted} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
