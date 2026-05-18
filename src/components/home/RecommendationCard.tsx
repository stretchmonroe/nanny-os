"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Leaf, ChevronDown, Send, MessageCircle, Check, Clock, X } from "lucide-react";
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
    <div className="mx-4 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-trust-light/60 via-surface-card to-amber-50/20 dark:from-trust-light/10 dark:via-surface-raised dark:to-amber-950/20 border-soft shadow-elevated">
      <div className="p-6">

        {/* Header row */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-trust flex items-center justify-center shrink-0 shadow-elevated">
            <Sparkles size={16} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-trust dark:text-trust-muted uppercase tracking-widest mb-1">
              Right now
            </p>
            <p className="text-[17px] font-bold text-foreground leading-snug tracking-tight">
              {action.recommendation}
            </p>
            <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
              {action.reason}
            </p>

            <div className="mt-3 flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-white/80 dark:bg-surface-raised border-soft text-trust dark:text-trust-muted text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-card">
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
            <div className="w-6 h-6 rounded-full bg-trust-light dark:bg-trust-light/15 flex items-center justify-center shrink-0 mt-0.5">
              <Leaf size={11} className="text-trust dark:text-trust-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-trust-muted uppercase tracking-widest mb-0.5">
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
              className="flex items-center gap-1 text-[11px] font-semibold text-trust dark:text-trust-muted active:opacity-70 transition-opacity"
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
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-trust dark:text-trust-muted bg-trust-light dark:bg-trust-light/10 border border-trust-light dark:border-trust-light/20 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
                >
                  <Send size={11} />
                  Share with Sofia
                </button>
                <button
                  onClick={() => setApproval("awaiting")}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground bg-muted px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
                >
                  <MessageCircle size={11} />
                  Check with Sofia
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
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-sage dark:text-sage-muted bg-sage-light dark:bg-sage-light/10 border border-sage-light dark:border-sage-light/20 px-3 py-1.5 rounded-full">
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
