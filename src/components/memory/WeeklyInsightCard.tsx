"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { weeklyPatterns, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

type WeekInsight = { weeklyPattern?: string; careNote?: string };

export default function WeeklyInsightCard() {
  const [observations, setObservations] = useState(weeklyPatterns.observations);

  useEffect(() => {
    const done = schedule.filter((s) => s.done).map((s) => s.title);
    callAI("insights", {
      childName: "Mateo",
      childAge: "18 months",
      developmentalFocus: "Fine Motor Skills",
      completedActivities: done,
      timeOfDay: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<WeekInsight>(res.result, {});
      if (parsed.weeklyPattern && parsed.careNote) {
        setObservations([
          parsed.weeklyPattern,
          parsed.careNote,
          weeklyPatterns.observations[2],
        ]);
      }
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/30 p-4 shadow-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
          This week&rsquo;s patterns
        </span>
      </div>
      <ul className="space-y-2">
        {observations.map((obs, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="text-emerald-400 dark:text-emerald-600 text-sm leading-none mt-0.5 shrink-0">·</span>
            <p className="text-[13px] text-foreground/80 dark:text-stone-300 leading-snug font-medium">
              {obs}
            </p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
