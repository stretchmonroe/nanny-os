"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, RefreshCw, Play, ChevronRight } from "lucide-react";
import { dailyActivities, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";
import GuidanceTag from "@/components/ui/GuidanceTag";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import { cn } from "@/lib/utils";
import type { PlannedActivity, FocusArea } from "@/lib/data/demo";

const areaConfig = {
  "language":       { emoji: "🗣️", label: "Language",      bg: "bg-lavender-light dark:bg-lavender/10", accent: "bg-lavender" },
  "sensory":        { emoji: "🫧", label: "Sensory",        bg: "bg-amber-50   dark:bg-amber-950/25",    accent: "bg-amber-400"  },
  "movement":       { emoji: "🏃", label: "Movement",       bg: "bg-sage-light dark:bg-sage/10",         accent: "bg-sage" },
  "practical-life": { emoji: "🏠", label: "Practical Life", bg: "bg-orange-50  dark:bg-orange-950/25",   accent: "bg-orange-400"  },
  "creativity":     { emoji: "🎨", label: "Creativity",     bg: "bg-rose-50    dark:bg-rose-950/25",     accent: "bg-rose-400"    },
} as const;

interface Props {
  focus: FocusArea;
}

export default function ActivityPlan({ focus }: Props) {
  const [activities, setActivities] = useState<PlannedActivity[]>(dailyActivities);
  const [swapping, setSwapping] = useState<string | null>(null);
  const { activeChild } = useAppStore();

  useEffect(() => {
    const done = schedule.filter((s) => s.done).map((s) => s.title);
    callAI("activityPlan", {
      childName: activeChild.name,
      childAge: activeChild.age,
      focusArea: focus,
      completedToday: done,
      timeOfDay: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<{ activities: PlannedActivity[] }>(res.result, { activities: [] });
      if (!parsed.activities?.length) return;
      const validated = parsed.activities.slice(0, 3).map((a, i) => ({
        ...dailyActivities[i],
        ...a,
        id: dailyActivities[i]?.id ?? `ai_${i}`,
        status: dailyActivities[i]?.status ?? ("pending" as const),
        guidanceSource: a.guidanceSource && isValidGuidanceSource(a.guidanceSource)
          ? a.guidanceSource
          : "General developmental practice",
      }));
      setActivities(validated);
    });
  }, [focus]);

  function setStatus(id: string, status: PlannedActivity["status"]) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function swap(id: string) {
    setSwapping(swapping === id ? null : id);
  }

  return (
    <div>
      <div className="px-5 mb-4">
        <p className="text-[11px] font-bold text-muted-foreground/35 uppercase tracking-[0.1em]">
          What to explore today
        </p>
      </div>

      <div className="flex gap-3 px-5 overflow-x-auto scroll-hide pb-1">
        {activities.map((activity, i) => {
          const cfg = areaConfig[activity.area] ?? areaConfig["language"];
          const isDone = activity.status === "done";
          const isActive = activity.status === "active";
          const showAlt = swapping === activity.id;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className={cn(
                "shrink-0 w-[82%] rounded-[1.5rem] border-soft shadow-card overflow-hidden relative",
                cfg.bg,
                isDone && "opacity-50",
              )}
            >
              {/* Active left bar */}
              {isActive && (
                <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full", cfg.accent)} />
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[28px]">{cfg.emoji}</span>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                        {cfg.label}
                      </p>
                      <p className={cn(
                        "text-[16px] font-bold text-foreground leading-snug tracking-tight mt-0.5",
                        isDone && "line-through text-muted-foreground",
                      )}>
                        {showAlt && activity.alternativeTitle ? activity.alternativeTitle : activity.title}
                      </p>
                    </div>
                  </div>
                  {isDone && (
                    <div className="w-6 h-6 rounded-full bg-sage-light dark:bg-sage-light/10 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={2.5} className="text-sage dark:text-sage-muted" />
                    </div>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">
                      Now
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[13px] text-foreground/70 leading-relaxed mb-3">
                  {showAlt && activity.alternativeDescription
                    ? activity.alternativeDescription
                    : activity.description}
                </p>

                {/* Duration + guidance */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {activity.duration}
                  </span>
                  {activity.guidanceSource && isValidGuidanceSource(activity.guidanceSource) && (
                    <GuidanceTag source={activity.guidanceSource} size="xs" />
                  )}
                </div>

                {/* Materials */}
                {activity.materials.length > 0 && !isDone && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {activity.materials.map((m) => (
                      <span key={m} className="text-[10px] font-medium text-muted-foreground bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {!isDone && (
                  <div className="flex items-center gap-2">
                    {activity.status === "pending" && (
                      <button
                        onClick={() => setStatus(activity.id, "active")}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground bg-white/70 dark:bg-white/10 border border-white/40 dark:border-white/10 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform shadow-card"
                      >
                        <Play size={11} />
                        Start
                      </button>
                    )}
                    {activity.status === "active" && (
                      <button
                        onClick={() => setStatus(activity.id, "done")}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-sage dark:text-sage-muted bg-sage-light dark:bg-sage-light/10 border border-sage-light dark:border-sage-light/20 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
                      >
                        <Check size={11} strokeWidth={2.5} />
                        Done
                      </button>
                    )}
                    {activity.alternativeTitle && (
                      <button
                        onClick={() => swap(activity.id)}
                        className={cn(
                          "flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full active:scale-[0.97] transition-all",
                          showAlt
                            ? "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40"
                            : "text-muted-foreground bg-white/50 dark:bg-white/5 border border-white/30 dark:border-white/10"
                        )}
                      >
                        <RefreshCw size={10} />
                        {showAlt ? "Original" : "Swap"}
                      </button>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground/30 ml-auto" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
