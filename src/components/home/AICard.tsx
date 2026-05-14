"use client";

import { useEffect, useState } from "react";
import { Sparkles, Brain } from "lucide-react";
import { aiSuggestion, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

type NextAction = {
  recommendation: string;
  reason: string;
  duration: string;
  backupOption: string;
};

const demo: NextAction = {
  recommendation: aiSuggestion.title,
  reason: aiSuggestion.body,
  duration: aiSuggestion.duration,
  backupOption: "Short walk outside",
};

export default function AICard() {
  const [action, setAction] = useState<NextAction>(demo);

  useEffect(() => {
    const lastDone = schedule.filter((s) => s.done).at(-1);
    const current = schedule.find((s) => s.active);

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
      if (parsed.recommendation) setAction(parsed);
    });
  }, []);

  return (
    <div className="mx-4 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-amber-50/60 dark:from-violet-950/60 dark:via-stone-900 dark:to-amber-950/40 border border-violet-100/80 dark:border-violet-900/40 p-5 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 flex items-center justify-center shrink-0 shadow-md shadow-violet-200/50 dark:shadow-violet-900/50">
          <Sparkles size={16} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mb-1">
            Right now
          </p>
          <p className="text-[15px] font-semibold text-zinc-900 dark:text-stone-100 leading-snug">
            {action.recommendation}
          </p>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 mt-1.5 leading-relaxed">
            {action.reason}
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              🎯 {aiSuggestion.activity}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
              {action.duration}
            </span>
          </div>

          {/* Developmental note */}
          <div className="mt-4 pt-4 border-t border-violet-100/60 dark:border-violet-900/30 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-0.5">
              <Brain size={11} className="text-violet-500 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-violet-400 dark:text-violet-500 uppercase tracking-wider mb-0.5">
                {aiSuggestion.developmentalFocus}
              </p>
              <p className="text-[12px] text-stone-500 dark:text-stone-400 leading-relaxed">
                {aiSuggestion.developmentalNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
