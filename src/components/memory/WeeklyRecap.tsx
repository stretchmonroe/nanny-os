"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, Star } from "lucide-react";
import { weeklyMoments, weeklyPatterns, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

type WeekInsight = { weeklyPattern?: string; careNote?: string };

export default function WeeklyRecap() {
  const [observations, setObservations] = useState(weeklyPatterns.observations);

  useEffect(() => {
    const done = schedule.filter((s) => s.done).map((s) => s.title);
    callAI("insights", {
      childName: "Mateo",
      childAge: "18 months",
      developmentalFocus: "Language & Communication",
      completedActivities: done,
      timeOfDay: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<WeekInsight>(res.result, {});
      if (parsed.weeklyPattern && parsed.careNote) {
        setObservations([parsed.weeklyPattern, parsed.careNote, weeklyPatterns.observations[2]]);
      }
    });
  }, []);

  const milestones = weeklyMoments.flatMap((day) =>
    day.moments
      .filter((m) => m.type === "milestone")
      .map((m) => ({ ...m, dayLabel: day.day }))
  ).slice(0, 4);

  const categories = new Set(weeklyMoments.flatMap((d) => d.moments.map((m) => m.category)));
  const skillLabels: Record<string, string> = {
    learning: "Language", outdoor: "Gross Motor", play: "Fine Motor",
    meal: "Self-Care", nap: "Regulation",
  };
  const skills = [...categories].map((c) => skillLabels[c]).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="rounded-[1.5rem] bg-emerald-50/60 dark:bg-emerald-950/15 border border-emerald-100/60 dark:border-emerald-900/25 shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-emerald-100/50 dark:border-emerald-900/20">
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
          This week&rsquo;s recap
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Patterns */}
        <ul className="space-y-3">
          {observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-emerald-300 dark:text-emerald-700 text-[16px] leading-none mt-0.5 shrink-0 select-none">—</span>
              <p className="text-[14px] text-foreground/80 dark:text-stone-300 leading-snug font-medium">{obs}</p>
            </li>
          ))}
        </ul>

        {/* Milestone highlights */}
        {milestones.length > 0 && (
          <div className="pt-4 border-t border-emerald-100/50 dark:border-emerald-900/20">
            <div className="flex items-center gap-1.5 mb-3">
              <Star className="w-3 h-3 text-amber-500" fill="currentColor" strokeWidth={0} />
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                Milestones this week
              </p>
            </div>
            <div className="space-y-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5">
                  <span className="text-amber-400 text-[11px] mt-0.5 shrink-0">✦</span>
                  <p className="text-[13px] text-foreground/75 leading-snug">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills practiced */}
        {skills.length > 0 && (
          <div className="pt-4 border-t border-emerald-100/50 dark:border-emerald-900/20">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2.5">
              Skills practiced
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
