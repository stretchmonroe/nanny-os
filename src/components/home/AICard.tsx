"use client";

import { useEffect, useState } from "react";
import { Sparkles, Brain } from "lucide-react";
import { aiSuggestion, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import GuidanceTag from "@/components/ui/GuidanceTag";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import type { GuidanceSource } from "@/lib/ai/guidance";

type NextAction = {
  recommendation: string;
  reason: string;
  duration: string;
  backupOption: string;
  guidanceSource?: GuidanceSource;
  developmentalReason?: string;
};

const demo: NextAction = {
  recommendation: aiSuggestion.title,
  reason: aiSuggestion.body,
  duration: aiSuggestion.duration,
  backupOption: "Short walk outside",
  guidanceSource: aiSuggestion.guidanceSource,
  developmentalReason: aiSuggestion.developmentalReason,
};

export default function AICard() {
  const [action, setAction] = useState<NextAction>(demo);

  useEffect(() => {
    const lastDone = schedule.filter((s) => s.done).at(-1);
    callAI("nextBestAction", {
      currentTime: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      lastActivity: lastDone?.title ?? "Morning Park Walk",
      energyLevel: "moderate",
      context: "Mateo, 18 months, developmental focus: Fine Motor Skills, sunny day",
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<NextAction>(res.result, demo);
      if (!parsed.recommendation) return;
      if (parsed.guidanceSource && !isValidGuidanceSource(parsed.guidanceSource)) {
        parsed.guidanceSource = "General developmental practice";
      }
      setAction(parsed);
    });
  }, []);

  const validSource = action.guidanceSource && isValidGuidanceSource(action.guidanceSource)
    ? action.guidanceSource
    : null;

  return (
    <div className="mx-4 rounded-[1.4rem] overflow-hidden bg-gradient-to-br from-violet-50 via-white to-amber-50/50 dark:from-violet-950/50 dark:via-surface-raised dark:to-amber-950/30 border-soft shadow-elevated p-5">
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 flex items-center justify-center shrink-0 shadow-elevated">
          <Sparkles size={16} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1">
            Right now
          </p>
          <p className="text-[15px] font-bold text-foreground leading-snug tracking-tight">
            {action.recommendation}
          </p>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
            {action.reason}
          </p>

          <div className="mt-3 flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-surface-raised border-soft text-violet-700 dark:text-violet-300 text-[12px] font-semibold px-3 py-1.5 rounded-full shadow-card">
              🎯 {aiSuggestion.activity}
            </span>
            <span className="text-[12px] text-muted-foreground font-medium">
              {action.duration}
            </span>
          </div>

          {/* Developmental note + guidance source */}
          <div className="mt-4 pt-3.5 border-t border-violet-100/50 dark:border-violet-900/30 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-0.5">
              <Brain size={12} className="text-violet-500 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 uppercase tracking-widest mb-0.5">
                {aiSuggestion.developmentalFocus}
              </p>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-2">
                {action.developmentalReason ?? aiSuggestion.developmentalNote}
              </p>
              {validSource && (
                <GuidanceTag source={validSource} size="xs" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
