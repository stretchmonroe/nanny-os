"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Lightbulb, FileText, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { callAI, parseAIJson } from "@/lib/ai/client";
import GuidanceTag from "@/components/ui/GuidanceTag";
import {
  aiSuggestion,
  aiJournalSummary,
  careNotes,
} from "@/lib/data/demo";
import MemorySearchPane from "./MemorySearchPane";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import type { GuidanceSource } from "@/lib/ai/guidance";

export type SproutMode = "suggest" | "summarize" | "history";

interface Props {
  open: boolean;
  onClose(): void;
  initialMode: SproutMode;
}

const TABS: { mode: SproutMode; icon: React.ElementType; label: string }[] = [
  { mode: "suggest",   icon: Lightbulb, label: "Suggest"   },
  { mode: "summarize", icon: FileText,  label: "Summarize" },
  { mode: "history",   icon: Clock,     label: "History"   },
];

// ── Suggest mode ──────────────────────────────────────────────────────────────

type SuggestResult = {
  headline: string;
  reason: string;
  duration: string;
  developmentalNote: string;
  guidanceSource: GuidanceSource;
};

const SUGGEST_DEMO: SuggestResult = {
  headline:          aiSuggestion.activity,
  reason:            aiSuggestion.body,
  duration:          aiSuggestion.duration,
  developmentalNote: aiSuggestion.developmentalNote,
  guidanceSource:    aiSuggestion.guidanceSource,
};

function SuggestPane() {
  const [data,    setData]    = useState<SuggestResult>(SUGGEST_DEMO);
  const [loading, setLoading] = useState(true);
  const [shared,  setShared]  = useState(false);

  useEffect(() => {
    setLoading(true);
    callAI("nextBestAction", {
      childName:          "Mateo",
      childAge:           "18 months",
      developmentalFocus: "Language & Communication",
      timeOfDay:          new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) { setLoading(false); return; }
      const parsed = parseAIJson<Partial<SuggestResult>>(res.result, {});
      setData({
        headline:          parsed.headline          ?? SUGGEST_DEMO.headline,
        reason:            parsed.reason            ?? SUGGEST_DEMO.reason,
        duration:          parsed.duration          ?? SUGGEST_DEMO.duration,
        developmentalNote: parsed.developmentalNote ?? SUGGEST_DEMO.developmentalNote,
        guidanceSource:    isValidGuidanceSource(parsed.guidanceSource ?? "")
          ? (parsed.guidanceSource as GuidanceSource)
          : SUGGEST_DEMO.guidanceSource,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10">
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={18} className="animate-spin text-muted-foreground/40" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Headline + duration */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sage/70 mb-1.5">
              Right now
            </p>
            <p className="text-[22px] font-extrabold text-foreground leading-snug tracking-tight mb-1">
              {data.headline}
            </p>
            <p className="text-[12px] font-semibold text-muted-foreground/50">
              {data.duration}
            </p>
          </div>

          {/* Reason */}
          <div
            className="rounded-2xl px-5 py-4 mb-4"
            style={{ background: "var(--surface-raised)" }}
          >
            <p className="text-[14px] text-foreground/75 leading-relaxed">
              {data.reason}
            </p>
          </div>

          {/* Developmental note */}
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
              Why this works
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {data.developmentalNote}
            </p>
          </div>

          {/* Guidance tag */}
          <div className="mb-6">
            <GuidanceTag source={data.guidanceSource} size="xs" />
          </div>

          {/* Share action */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setShared((v) => !v)}
            className={cn(
              "w-full py-3.5 rounded-2xl text-[14px] font-bold tracking-tight transition-colors duration-200",
              shared
                ? "bg-sage-light text-sage"
                : "bg-trust-light text-trust"
            )}
          >
            {shared ? "Shared with Sofia ✓" : "Share with Sofia"}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// ── Summarize mode ────────────────────────────────────────────────────────────

type SummaryResult = {
  headline: string;
  summary: string;
  highlights: string[];
};

const SUMMARY_DEMO: SummaryResult = {
  headline:   aiJournalSummary.headline,
  summary:    aiJournalSummary.summary,
  highlights: aiJournalSummary.highlights,
};

function SummarizePane() {
  const [data,    setData]    = useState<SummaryResult>(SUMMARY_DEMO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    callAI("dailySummary", {
      childName: "Mateo",
      childAge:  "18 months",
      notes:     careNotes.map((n) => `${n.label}: ${n.note}`).join("\n"),
    }).then((res) => {
      if (!res) { setLoading(false); return; }
      const parsed = parseAIJson<Partial<SummaryResult>>(res.result, {});
      setData({
        headline:   parsed.headline   ?? SUMMARY_DEMO.headline,
        summary:    parsed.summary    ?? SUMMARY_DEMO.summary,
        highlights: parsed.highlights ?? SUMMARY_DEMO.highlights,
      });
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10">
      {loading ? (
        <div className="flex items-center justify-center py-14">
          <Loader2 size={18} className="animate-spin text-muted-foreground/40" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Headline */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
            Today
          </p>
          <p className="text-[22px] font-extrabold text-foreground leading-snug tracking-tight mb-4">
            {data.headline}
          </p>

          {/* Summary paragraph */}
          <p className="text-[14px] text-foreground/75 leading-relaxed mb-6">
            {data.summary}
          </p>

          {/* Highlights */}
          {data.highlights.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3">
                Highlights
              </p>
              <div className="space-y-2">
                {data.highlights.map((h) => (
                  <div
                    key={h}
                    className="flex items-start gap-3 rounded-2xl px-4 py-3"
                    style={{ background: "var(--surface-raised)" }}
                  >
                    <span className="text-[14px] leading-none mt-0.5">✦</span>
                    <p className="text-[13px] text-foreground/80 leading-snug">{h}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Care notes */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3">
            Care notes
          </p>
          <div className="space-y-3">
            {careNotes.map((note) => (
              <div key={note.label} className="flex items-start gap-3">
                <span className="text-[16px] leading-none mt-0.5">{note.icon}</span>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                    {note.label}
                  </p>
                  <p className="text-[13px] text-foreground/70 leading-relaxed">
                    {note.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── History mode — delegates to AI-powered MemorySearchPane ──────────────────

function HistoryPane() {
  return <MemorySearchPane />;
}

// ── Sheet container ───────────────────────────────────────────────────────────

export default function SproutSheet({ open, onClose, initialMode }: Props) {
  const [mode, setMode] = useState<SproutMode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sprout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="sprout-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto flex flex-col"
            style={{ height: "82dvh" }}
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
                  <span className="text-[11px] font-bold text-sage tracking-[0.13em] uppercase">
                    Sprout
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Mode tabs */}
              <div className="flex items-center gap-1.5 px-5 mb-5 shrink-0">
                {TABS.map(({ mode: m, icon: Icon, label }) => (
                  <motion.button
                    key={m}
                    onClick={() => setMode(m)}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-colors duration-200",
                      mode === m
                        ? "bg-sage-light text-sage"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                    style={mode !== m ? { background: "var(--surface-raised)" } : undefined}
                  >
                    <Icon size={11} strokeWidth={2} />
                    {label}
                  </motion.button>
                ))}
              </div>

              {/* Pane — animated swap */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                  {mode === "suggest"   && <SuggestPane />}
                  {mode === "summarize" && <SummarizePane />}
                  {mode === "history"   && <HistoryPane />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
