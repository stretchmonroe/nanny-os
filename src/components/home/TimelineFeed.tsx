"use client";

import { motion } from "framer-motion";
import { schedule, typeConfig } from "@/lib/data/demo";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthorBadge from "@/components/ui/AuthorBadge";

export default function TimelineFeed() {
  const done = schedule.filter((s) => s.done).length;

  return (
    <div className="mx-4 bg-surface-card rounded-[1.4rem] shadow-card border-soft overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3.5 border-b border-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-foreground tracking-tight">
            Today&rsquo;s Schedule
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full tabular-nums">
            {done}/{schedule.length}
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        {schedule.map((item, i) => {
          const config = typeConfig[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3 px-5 py-3.5 relative",
                item.active && "bg-amber-50/60 dark:bg-amber-950/15",
                item.done && "opacity-45",
                i < schedule.length - 1 && "border-b border-soft"
              )}
            >
              {/* Active left bar */}
              {item.active && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full" />
              )}

              {/* Time */}
              <span className="text-[11px] text-muted-foreground w-10 shrink-0 pt-[3px] tabular-nums font-semibold">
                {item.time}
              </span>

              {/* Dot + line */}
              <div className="flex flex-col items-center shrink-0 pt-[4px]">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-colors",
                    item.done
                      ? "bg-border"
                      : item.active
                      ? "bg-amber-400 ring-[3px] ring-offset-1 ring-amber-200 dark:ring-amber-900"
                      : config.dot
                  )}
                />
                {i < schedule.length - 1 && (
                  <div className="w-px flex-1 min-h-[22px] bg-border/50 mt-1.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[14px] font-semibold leading-snug tracking-tight",
                      item.done
                        ? "line-through text-muted-foreground/60"
                        : "text-foreground"
                    )}
                  >
                    {item.title}
                  </p>

                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    {item.active && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                    {item.done ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                        <Check size={11} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : !item.active ? (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", config.color)}>
                        {config.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                {item.notes && (
                  <div className="mt-0.5">
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                      {item.notes}
                    </p>
                    {(item.done || item.active) && "loggedBy" in item && item.loggedBy && (
                      <AuthorBadge
                        author={item.loggedBy}
                        className="mt-1.5 opacity-70"
                      />
                    )}
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
