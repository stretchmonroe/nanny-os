"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, RefreshCw, Play, ChevronRight } from "lucide-react";
import { dailyActivities, schedule, typeConfig } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import GuidanceTag from "@/components/ui/GuidanceTag";
import { isValidGuidanceSource } from "@/lib/ai/guidance";
import { cn } from "@/lib/utils";
import type { PlannedActivity, FocusArea } from "@/lib/data/demo";
import { supabase } from "@/lib/supabase/client";

function ageLabel(birthDate?: string | null): string {
  if (!birthDate) return "18 months";
  const birth = new Date(birthDate);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years`;
}

const areaConfig = {
  "language":       { emoji: "🗣️", label: "Language",      bg: "bg-lavender-light dark:bg-lavender/10", accent: "bg-lavender" },
  "sensory":        { emoji: "🫧", label: "Sensory",        bg: "bg-amber-50   dark:bg-amber-950/25",   accent: "bg-amber-400"  },
  "movement":       { emoji: "🏃", label: "Movement",       bg: "bg-sage-light dark:bg-sage/10",         accent: "bg-sage"       },
  "practical-life": { emoji: "🏠", label: "Practical Life", bg: "bg-orange-50  dark:bg-orange-950/25", accent: "bg-orange-400"  },
  "creativity":     { emoji: "🎨", label: "Creativity",     bg: "bg-rose-50    dark:bg-rose-950/25",   accent: "bg-rose-400"    },
} as const;

const categoryBg: Record<string, string> = {
  meal:     "bg-amber-50 dark:bg-amber-950/25",
  outdoor:  "bg-sky-50 dark:bg-sky-950/25",
  play:     "bg-sage-light dark:bg-sage/10",
  nap:      "bg-trust-light dark:bg-trust/10",
  learning: "bg-lavender-light dark:bg-lavender/10",
  creative: "bg-rose-50 dark:bg-rose-950/25",
};

const categoryEmoji: Record<string, string> = {
  meal:     "🍽️",
  outdoor:  "🌳",
  play:     "🎮",
  nap:      "💤",
  learning: "📚",
  creative: "🎨",
};

type MemoryEvent = {
  id: string;
  type: "photo" | "note" | "milestone";
  content: string;
  category: string;
  image_url: string | null;
  created_at: string;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface Props {
  focus:           FocusArea;
  childName?:      string | null;
  childBirthDate?: string | null;
  childId?:        string | null;
}

export default function ActivityPlan({ focus, childName, childBirthDate, childId }: Props) {
  const [activities, setActivities] = useState<PlannedActivity[]>(dailyActivities);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [events, setEvents]     = useState<MemoryEvent[]>([]);
  const [loading, setLoading]   = useState(false);

  // Real child: fetch today's diary entries
  useEffect(() => {
    if (!childId) return;

    function fetchEvents() {
      setLoading(true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      supabase
        .from("memory_events")
        .select("id, type, content, category, image_url, created_at")
        .eq("child_id", childId as string)
        .gte("created_at", todayStart.toISOString())
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          setEvents((data as MemoryEvent[]) ?? []);
          setLoading(false);
        });
    }

    fetchEvents();

    // Re-fetch when navigating back to this page
    function onFocus() { fetchEvents(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [childId]);

  // Demo mode: call AI for suggestions
  useEffect(() => {
    if (childId) return;
    const done = schedule.filter((s) => s.done).map((s) => s.title);
    const name = childName ?? "Mateo";
    const age  = ageLabel(childBirthDate);
    callAI("activityPlan", {
      childName:      name,
      childAge:       age,
      focusArea:      focus,
      completedToday: done,
      timeOfDay:      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
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
  }, [focus, childId]);

  function setStatus(id: string, status: PlannedActivity["status"]) {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  function swap(id: string) {
    setSwapping(swapping === id ? null : id);
  }

  // ── Real child view ───────────────────────────────────────────────────────────
  if (childId) {
    return (
      <div>
        <div className="flex items-center justify-between px-5 mb-4">
          <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em]">
            Today&rsquo;s activities
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground/50">
            {events.length > 0 ? `${events.length} logged` : ""}
          </p>
        </div>

        {loading ? (
          <div className="px-5">
            <div className="h-[160px] rounded-[1.5rem] bg-surface-raised animate-pulse" />
          </div>
        ) : events.length === 0 ? (
          <div className="mx-5 rounded-[1.5rem] bg-surface-raised border-soft px-6 py-8 text-center">
            <p className="text-[28px] mb-2">📓</p>
            <p className="text-[14px] font-semibold text-foreground/60">Nothing logged yet today</p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Activities added in the diary will show up here.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 px-5 overflow-x-auto scroll-hide pb-1">
            {events.map((event, i) => {
              const bg  = categoryBg[event.category] ?? "bg-surface-raised";
              const emoji = categoryEmoji[event.category] ?? "✏️";
              const cfg   = typeConfig[event.category as keyof typeof typeConfig];

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  className={cn("shrink-0 w-[82%] rounded-[1.5rem] border-soft shadow-card overflow-hidden", bg)}
                >
                  {event.image_url && (
                    <div className="w-full h-[140px] overflow-hidden">
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[20px]">{emoji}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", cfg?.color ?? "text-muted-foreground bg-surface-raised")}>
                        {cfg?.label ?? event.category}
                      </span>
                      {event.type === "milestone" && (
                        <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">
                          🌟 Milestone
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-foreground/80 leading-relaxed line-clamp-3">
                      {event.content}
                    </p>
                    <p className="text-[11px] text-muted-foreground/50 mt-2.5 font-medium">
                      {formatTime(event.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Demo mode: AI-generated suggestions ──────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between px-5 mb-4">
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em]">
          Today&rsquo;s activities
        </p>
        <p className="text-[11px] font-semibold text-muted-foreground/50">
          {activities.filter((a) => a.status === "done").length}/{activities.length} done
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
              {isActive && (
                <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full", cfg.accent)} />
              )}

              <div className="p-6">
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
                    <div className="w-6 h-6 rounded-full bg-sage-light flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={2.5} className="text-sage" />
                    </div>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">
                      Now
                    </span>
                  )}
                </div>

                <p className="text-[13px] text-foreground/70 leading-relaxed mb-3">
                  {showAlt && activity.alternativeDescription
                    ? activity.alternativeDescription
                    : activity.description}
                </p>

                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {activity.duration}
                  </span>
                  {activity.guidanceSource && isValidGuidanceSource(activity.guidanceSource) && (
                    <GuidanceTag source={activity.guidanceSource} size="xs" />
                  )}
                </div>

                {activity.materials.length > 0 && !isDone && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {activity.materials.map((m) => (
                      <span key={m} className="text-[10px] font-medium text-muted-foreground bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

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
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-sage bg-sage-light border border-sage-light px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
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
