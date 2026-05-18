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
      className="rounded-[1.5rem] bg-sage-light/70 dark:bg-sage-light/5 border border-sage-light dark:border-sage-light/15 shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-sage-light dark:border-sage-light/15">
        <TrendingUp className="w-3.5 h-3.5 text-sage dark:text-sage-muted" strokeWidth={2.2} />
        <span className="text-[10px] font-bold text-sage dark:text-sage-muted uppercase tracking-widest">
          Mateo&rsquo;s week
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Patterns */}
        <ul className="space-y-3">
          {observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-sage-muted dark:text-sage-muted/40 text-[16px] leading-none mt-0.5 shrink-0 select-none">—</span>
              <p className="text-[14px] text-foreground/80 dark:text-stone-300 leading-snug font-medium">{obs}</p>
            </li>
          ))}
        </ul>

        {/* Milestone highlights */}
        {milestones.length > 0 && (
          <div className="pt-4 border-t border-sage-light dark:border-sage-light/15">
            <div className="flex items-center gap-1.5 mb-3">
              <Star className="w-3 h-3 text-amber-500" fill="currentColor" strokeWidth={0} />
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                Moments that mattered
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
          <div className="pt-4 border-t border-sage-light dark:border-sage-light/15">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2.5">
              What Mateo explored
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] font-semibold text-sage dark:text-sage-muted bg-sage-light dark:bg-sage-light/20 px-3 py-1.5 rounded-full"
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
