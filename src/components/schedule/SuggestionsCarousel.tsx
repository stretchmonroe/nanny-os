"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDailyActivities } from "@/lib/data/activities";
import type { AgedActivity } from "@/lib/data/activities";
import { useDailyActivitiesStore } from "@/store/useDailyActivitiesStore";

const areaConfig: Record<string, { emoji: string; label: string; bg: string; border: string }> = {
  "language":       { emoji: "🗣️", label: "Language",       bg: "bg-lavender-light/60 dark:bg-lavender/8", border: "border-lavender-light dark:border-lavender/15" },
  "sensory":        { emoji: "🫧", label: "Sensory",         bg: "bg-amber-50/60 dark:bg-amber-950/15",    border: "border-amber-100/80 dark:border-amber-900/20"  },
  "movement":       { emoji: "🏃", label: "Movement",        bg: "bg-sky-50/60 dark:bg-sky-950/15",        border: "border-sky-100/80 dark:border-sky-900/20"      },
  "practical-life": { emoji: "🏠", label: "Practical Life",  bg: "bg-orange-50/60 dark:bg-orange-950/15",  border: "border-orange-100/80 dark:border-orange-900/20" },
  "creativity":     { emoji: "🎨", label: "Creativity",      bg: "bg-rose-50/60 dark:bg-rose-950/15",      border: "border-rose-100/80 dark:border-rose-900/20"    },
};

interface CardProps {
  activity: AgedActivity;
  onDone: () => void;
  onSkip: () => void;
}

function SuggestionCard({ activity, onDone, onSkip }: CardProps) {
  const cfg = areaConfig[activity.area] ?? areaConfig["language"];

  return (
    <div className={cn("w-[88%] max-w-[340px] shrink-0 snap-start rounded-[1.4rem] border overflow-hidden", cfg.bg, cfg.border)}>
      {/* Label strip */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-0">
        <span className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-[0.12em]">
          Suggested · {cfg.emoji} {cfg.label}
        </span>
      </div>

      <div className="px-4 pt-2.5 pb-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[16px] font-bold text-foreground leading-snug tracking-tight">{activity.title}</p>
          <p className="text-[12px] font-semibold text-muted-foreground/70 shrink-0 mt-0.5 whitespace-nowrap">{activity.duration}</p>
        </div>

        <p className="text-[13px] text-foreground/65 leading-relaxed">{activity.description}</p>

        {activity.materials.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-semibold text-muted-foreground/45 mr-0.5">Needs:</span>
            {activity.materials.map((m) => (
              <span key={m} className="text-[10px] font-medium text-muted-foreground bg-white/60 dark:bg-black/15 px-2 py-0.5 rounded-full border border-white/40 dark:border-white/8">
                {m}
              </span>
            ))}
          </div>
        )}

        {activity.guidanceSource && (
          <p className="text-[11px] text-muted-foreground/50 italic">{activity.guidanceSource}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onDone}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-sage bg-white/70 dark:bg-black/20 border border-white/50 dark:border-white/8 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
          >
            <Check size={11} strokeWidth={2.5} />
            Did this
          </button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground bg-white/50 dark:bg-black/15 border border-white/30 dark:border-white/5 px-3 py-1.5 rounded-full active:scale-[0.97] transition-transform"
          >
            <SkipForward size={11} />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  birthDate?: string | null;
  childId?: string | null;
  className?: string;
}

export default function SuggestionsCarousel({ birthDate, childId, className }: Props) {
  const [allActivities]           = useState(() => getDailyActivities(birthDate, childId, 10));
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const markDone                  = useDailyActivitiesStore((s) => s.markDone);

  const visible = allActivities.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function handleDone(activity: AgedActivity) {
    dismiss(activity.id);
    if (!childId) return; // demo mode — nothing to persist

    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    markDone({
      id:          activity.id,
      title:       activity.title,
      description: activity.description,
      area:        activity.area,
      childId,
      date,
      completedAt: d.toISOString(),
    });
  }

  return (
    <div className={className}>
      <div className="px-5 mb-3">
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em]">
          Today&rsquo;s suggestions
        </p>
        <p className="text-[11px] text-muted-foreground/40 mt-0.5">
          {visible.length} activities · swipe to browse
        </p>
      </div>
      <div className="flex scroll-hide overflow-x-auto snap-x snap-mandatory gap-3 pl-5 pr-5 pb-1">
        <AnimatePresence>
          {visible.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
              className="shrink-0 snap-start"
            >
              <SuggestionCard
                activity={activity}
                onDone={() => handleDone(activity)}
                onSkip={() => dismiss(activity.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
