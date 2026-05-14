"use client";

import { motion } from "framer-motion";
import { schedule, typeConfig } from "@/lib/data/demo";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthorBadge from "@/components/ui/AuthorBadge";

export default function TimelineFeed() {
  return (
    <div className="mx-5">
      {/* Section label */}
      <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em] mb-3">
        Today
      </p>

      {/* Items */}
      <div className="space-y-1">
        {schedule.map((item, i) => {
          const config = typeConfig[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3 px-4 py-4 rounded-2xl relative transition-colors",
                item.active && "bg-amber-50/80 dark:bg-amber-950/20",
                item.done && "opacity-35",
              )}
            >
              {/* Active left bar */}
              {item.active && (
                <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full" />
              )}

              {/* Time */}
              <span className="text-[11px] text-muted-foreground/70 w-10 shrink-0 pt-[3px] tabular-nums font-semibold">
                {item.time}
              </span>

              {/* Dot + line */}
              <div className="flex flex-col items-center shrink-0 pt-[5px]">
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
                  <div className="w-px flex-1 min-h-[24px] bg-border/40 mt-1.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[14px] font-semibold leading-snug tracking-tight",
                      item.done
                        ? "line-through text-muted-foreground/50"
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
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", config.color)}>
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
                        className="mt-2 opacity-70"
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
