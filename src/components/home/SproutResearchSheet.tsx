"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { callAI, parseAIJson } from "@/lib/ai/client";
import GuidanceTag from "@/components/ui/GuidanceTag";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import type { GuidanceSource } from "@/lib/ai/guidance";
import SproutResultActions from "./SproutResultActions";
import MemorySearchPane from "./MemorySearchPane";

// ── Types ─────────────────────────────────────────────────────────────────────

type ResearchCategory = "development" | "activities" | "milestones" | "history";

interface ResearchResult {
  headline:      string;
  answer:        string;
  guidanceSource: GuidanceSource;
  ageContext:    string;
  relatedTopics: string[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: ResearchCategory; emoji: string; label: string }[] = [
  { id: "development", emoji: "🧠", label: "Development"    },
  { id: "activities",  emoji: "🎯", label: "Activities"     },
  { id: "milestones",  emoji: "⭐", label: "Milestones"     },
  { id: "history",     emoji: "📖", label: "Mateo's Story"  },
];

const SUGGESTIONS: Record<Exclude<ResearchCategory, "history">, string[]> = {
  development: [
    "When do toddlers start sharing?",
    "Normal speech at 18 months?",
    "What is parallel play?",
    "How does outdoor time help language?",
  ],
  activities: [
    "Activity ideas for language",
    "Fine motor play for 18 months",
    "Outdoor rainy day ideas",
    "Calming activities before nap",
  ],
  milestones: [
    "What milestones are next?",
    "Is 'more' a milestone?",
    "Signs of readiness for more words",
    "When does pretend play start?",
  ],
};

// ── Ask pane ──────────────────────────────────────────────────────────────────

function AskPane({ category }: { category: Exclude<ResearchCategory, "history"> }) {
  const [question,  setQuestion]  = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<ResearchResult | null>(null);

  const suggestions = SUGGESTIONS[category];
  const canAsk = question.trim().length > 0;

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setQuestion(text);
    setSubmitted(text);
    setLoading(true);
    setResult(null);

    const res = await callAI("research", {
      question:  text,
      childAge:  "18 months",
      childName: "Mateo",
      category,
    });

    setLoading(false);
    if (!res) return;

    const parsed = parseAIJson<Partial<ResearchResult>>(res.result, {});
    setResult({
      headline:       parsed.headline      ?? text,
      answer:         parsed.answer        ?? "Something went wrong — try rephrasing.",
      guidanceSource: isValidGuidanceSource(parsed.guidanceSource ?? "")
        ? (parsed.guidanceSource as GuidanceSource)
        : "General developmental practice",
      ageContext:    parsed.ageContext    ?? "",
      relatedTopics: parsed.relatedTopics ?? [],
    });
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Input */}
      <div className="px-5 mb-4 shrink-0">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && canAsk) ask(); }}
            placeholder="Ask anything about Mateo…"
            className="flex-1 text-[14px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic font-medium"
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => ask()}
            disabled={!canAsk || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
            style={{ background: canAsk && !loading ? "var(--sage)" : "var(--border-medium)" }}
          >
            {loading
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <ArrowUp size={14} className="text-white" strokeWidth={2.5} />
            }
          </motion.button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">

          {/* Suggestion chips */}
          {!result && !loading && (
            <motion.div
              key="suggestions"
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
                {suggestions.map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setQuestion(s); ask(s); }}
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
                Thinking about Mateo…
              </p>
            </motion.div>
          )}

          {/* Result */}
          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.25, 1, 0.5, 1] }}
              className="px-5 pb-6"
            >
              {result.ageContext && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
                  {result.ageContext}
                </p>
              )}

              <p className="text-[21px] font-extrabold text-foreground leading-snug tracking-tight mb-4">
                {result.headline}
              </p>

              <div
                className="rounded-2xl px-5 py-4 mb-4"
                style={{ background: "var(--surface-raised)" }}
              >
                <p className="text-[14px] text-foreground/75 leading-relaxed">
                  {result.answer}
                </p>
              </div>

              <div className="mb-5">
                <GuidanceTag source={result.guidanceSource} size="xs" />
              </div>

              {result.relatedTopics.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2.5">
                    Follow up
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.relatedTopics.map((t) => (
                      <motion.button
                        key={t}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => { setQuestion(t); ask(t); }}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                        style={{
                          background: "var(--accent-light)",
                          color:      "var(--accent-primary)",
                          border:     "1.5px solid transparent",
                        }}
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky action bar — only when result is present */}
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

// ── History pane — delegates to AI-powered MemorySearchPane ──────────────────

function HistoryPane() {
  return <MemorySearchPane />;
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

interface Props {
  open:     boolean;
  onClose(): void;
}

export default function SproutResearchSheet({ open, onClose }: Props) {
  const [category, setCategory] = useState<ResearchCategory>("development");

  useEffect(() => {
    if (open) setCategory("development");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="srsh-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="srsh-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto flex flex-col"
            style={{ height: "88dvh" }}
          >
            <div
              className="flex flex-col h-full rounded-t-[2rem] pt-3"
              style={{ background: "var(--surface-card)" }}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-3 shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="text-[18px] leading-none select-none"
                    animate={{ rotate: [0, 5, -3, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", repeatDelay: 5 }}
                  >
                    🌱
                  </motion.span>
                  <div>
                    <span className="text-[11px] font-bold text-sage tracking-[0.13em] uppercase">
                      Sprout
                    </span>
                    <span className="text-[11px] text-muted-foreground/40 font-medium ml-1.5">
                      · Research
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Category chips */}
              <div className="flex items-center gap-2 px-5 mb-5 overflow-x-auto shrink-0">
                {CATEGORIES.map(({ id, emoji, label }) => (
                  <motion.button
                    key={id}
                    whileTap={{ scale: 0.91 }}
                    onClick={() => setCategory(id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-colors duration-200 shrink-0",
                      category === id ? "bg-sage-light text-sage" : "text-muted-foreground/50"
                    )}
                    style={category !== id ? { background: "var(--surface-raised)" } : undefined}
                  >
                    <span className="text-[13px] leading-none">{emoji}</span>
                    {label}
                  </motion.button>
                ))}
              </div>

              {/* Pane — remounts on category change, resetting all state */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.16 }}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                  {category === "history"
                    ? <HistoryPane />
                    : <AskPane category={category} />
                  }
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
