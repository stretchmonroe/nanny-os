"use client";

import { motion } from "framer-motion";
import { schedule, sproutEntries, typeConfig } from "@/lib/data/demo";
import type { ScheduleItem, SproutEntry, TimelineItem } from "@/lib/data/demo";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AttributionLine from "@/components/ui/AttributionLine";

function isSprout(item: TimelineItem): item is SproutEntry {
  return "entryType" in item && item.entryType === "sprout";
}

// Merge schedule + sprout entries sorted by time string (HH:MM)
function buildTimeline(): TimelineItem[] {
  const mixed: TimelineItem[] = [...schedule, ...sproutEntries];
  return mixed.sort((a, b) => a.time.localeCompare(b.time));
}

function ReactionCluster({ reactions }: { reactions: { emoji: string; count: number }[] }) {
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {reactions.map(r => (
        <span
          key={r.emoji}
          className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full bg-surface-raised"
        >
          <span>{r.emoji}</span>
          {r.count > 1 && (
            <span className="text-[10px] font-semibold text-muted-foreground/50">{r.count}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function SproutCard({ entry, isLast }: { entry: SproutEntry; isLast: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2">
      {/* Time */}
      <span className="text-[11px] text-muted-foreground/35 w-10 shrink-0 pt-[3px] tabular-nums font-semibold">
        {entry.time}
      </span>

      {/* Thin connector — no dot */}
      <div className="flex flex-col items-center shrink-0 pt-[6px]">
        <div className={cn("w-px min-h-[60px]", isLast ? "bg-transparent" : "bg-border/20")} />
      </div>

      {/* Content bubble */}
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="bg-lavender-light/60 dark:bg-lavender/8 rounded-xl px-3.5 py-3 border border-lavender-light dark:border-lavender/15">
          <AttributionLine actor="ai" action="noticed" className="mb-1.5" />
          <p className="text-[13px] font-semibold text-foreground/80 leading-snug">
            {entry.headline}
          </p>
          <p className="text-[12px] text-muted-foreground/65 mt-1 leading-relaxed italic">
            {entry.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TimelineFeed() {
  const items = buildTimeline();

  return (
    <div className="mx-5">
      <p className="text-[11px] font-bold text-muted-foreground/35 uppercase tracking-[0.1em] mb-3">
        How the day flowed
      </p>

      <div>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          if (isSprout(item)) {
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
              >
                <SproutCard entry={item} isLast={isLast} />
              </motion.div>
            );
          }

          const si = item as ScheduleItem;
          const config = typeConfig[si.type];

          return (
            <motion.div
              key={si.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3 px-4 py-4 rounded-2xl relative transition-colors",
                si.active && "bg-amber-50/80 dark:bg-amber-950/20",
                si.done && "opacity-40",
              )}
            >
              {si.active && (
                <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full" />
              )}

              {/* Time */}
              <span className="text-[11px] text-muted-foreground/70 w-10 shrink-0 pt-[3px] tabular-nums font-semibold">
                {si.time}
              </span>

              {/* Dot + line */}
              <div className="flex flex-col items-center shrink-0 pt-[5px]">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-colors",
                    si.done
                      ? "bg-border"
                      : si.active
                      ? "bg-amber-400 ring-[3px] ring-offset-1 ring-amber-200 dark:ring-amber-900"
                      : config.dot
                  )}
                />
                {!isLast && (
                  <div className="w-px flex-1 min-h-[24px] bg-border/40 mt-1.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-0.5">
                {/* Attribution line — completed takes priority over approved */}
                {si.completedBy ? (
                  <AttributionLine actor={si.completedBy} action="completed" />
                ) : si.approvedBy ? (
                  <AttributionLine actor={si.approvedBy} action="approved" />
                ) : null}

                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[14px] font-semibold leading-snug tracking-tight",
                      si.done ? "text-muted-foreground/60" : "text-foreground"
                    )}
                  >
                    {si.title}
                  </p>

                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    {si.active && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                    {si.done ? (
                      <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center">
                        <Check size={11} strokeWidth={2.5} className="text-sage" />
                      </div>
                    ) : !si.active ? (
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", config.color)}>
                        {config.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                {si.notes && (
                  <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">
                    {si.notes}
                  </p>
                )}

                {si.reactions && si.reactions.length > 0 && (
                  <ReactionCluster reactions={si.reactions} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
