"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, ChevronDown, Send, MessageCircle, Check, Clock, X } from "lucide-react";
import { aiSuggestion, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import GuidanceTag from "@/components/ui/GuidanceTag";
import { cn } from "@/lib/utils";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import type { GuidanceSource } from "@/lib/ai/guidance";

type RichRecommendation = {
  recommendation: string;
  reason: string;
  duration: string;
  backupOption: string;
  developmentalReason: string;
  guidanceSource: GuidanceSource;
  ageRange: string;
  flagForApproval: boolean;
};

type ApprovalState = "idle" | "shared" | "awaiting";

const demo: RichRecommendation = {
  recommendation: aiSuggestion.title,
  reason: aiSuggestion.body,
  duration: aiSuggestion.duration,
  backupOption: "Short walk outside",
  developmentalReason: aiSuggestion.developmentalReason,
  guidanceSource: aiSuggestion.guidanceSource,
  ageRange: aiSuggestion.ageRange,
  flagForApproval: aiSuggestion.flagForApproval,
};

export default function RecommendationCard() {
  const [action, setAction] = useState<RichRecommendation>(demo);
  const [expanded, setExpanded] = useState(false);
  const [approval, setApproval] = useState<ApprovalState>("idle");

  useEffect(() => {
    const lastDone = schedule.filter((s) => s.done).at(-1);
    callAI("nextBestAction", {
      currentTime: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      lastActivity: lastDone?.title ?? "Morning Park Walk",
      energyLevel: "moderate",
      context: "Mateo, 18 months, developmental focus: Language & Communication, sunny day",
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<RichRecommendation>(res.result, demo);
      if (!parsed.recommendation) return;
      if (parsed.guidanceSource && !isValidGuidanceSource(parsed.guidanceSource)) {
        parsed.guidanceSource = "General developmental practice";
      }
      setAction(parsed);
      if (parsed.flagForApproval) setApproval("awaiting");
    });
  }, []);

  return (
    <div className="mx-4 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-violet-50 via-white to-amber-50/40 dark:from-violet-950/50 dark:via-surface-raised dark:to-amber-950/30 border-soft shadow-elevated">
      <div className="p-6">

        {/* Header row */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 flex items-center justify-center shrink-0 shadow-elevated">
            <Sparkles size={16} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1">
              Right now
            </p>
            <p className="text-[17px] font-bold text-foreground leading-snug tracking-tight">
              {action.recommendation}
            </p>
            <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
              {action.reason}
            </p>

            <div className="mt-3 flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-surface-raised border-soft text-violet-700 dark:text-violet-300 text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-card">
                🎯 {aiSuggestion.activity}
              </span>
              <span className="text-[12px] text-muted-foreground/70 font-medium">
                {action.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Developmental guidance — no border, flows naturally */}
        <div className="mt-6">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-full bg-violet-100/80 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <Brain size={12} className="text-violet-500 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-violet-400/80 dark:text-violet-500/70 uppercase tracking-widest mb-0.5">
                {aiSuggestion.developmentalFocus}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {aiSuggestion.developmentalNote}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <GuidanceTag source={action.guidanceSource} />
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-500 dark:text-violet-400 active:opacity-70 transition-opacity"
            >
              Why this works
              <ChevronDown
                size={13}
                className={cn("transition-transform duration-200", expanded && "rotate-180")}
              />
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                    {action.developmentalReason}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground/50">Aligned with</span>
                    <GuidanceTag source={action.guidanceSource} size="xs" static />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share / approval actions — no border, flows naturally */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {approval === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <button
                  onClick={() => setApproval("shared")}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
                >
                  <Send size={11} />
                  Share with Sofia
                </button>
                <button
                  onClick={() => setApproval("awaiting")}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
                >
                  <MessageCircle size={11} />
                  Ask Sofia first
                </button>
              </motion.div>
            )}

            {approval === "shared" && (
              <motion.div
                key="shared"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-full">
                  <Check size={11} strokeWidth={2.5} />
                  Shared with Sofia
                </span>
                <button
                  onClick={() => setApproval("idle")}
                  className="text-[11px] text-muted-foreground/50 font-medium active:opacity-70"
                >
                  undo
                </button>
              </motion.div>
            )}

            {approval === "awaiting" && (
              <motion.div
                key="awaiting"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 px-3 py-1.5 rounded-full">
                  <Clock size={11} />
                  Waiting for Sofia
                </span>
                <button
                  onClick={() => setApproval("idle")}
                  className="w-6 h-6 rounded-full bg-muted flex items-center justify-center active:opacity-70"
                >
                  <X size={10} className="text-muted-foreground" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
