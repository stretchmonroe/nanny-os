"use client";

import { motion } from "framer-motion";
import { schedule, typeConfig } from "@/lib/data/demo";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimelineFeed() {
  const done = schedule.filter((s) => s.done).length;

  return (
    <div className="mx-4 bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-100/80 dark:border-stone-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-stone-50 dark:border-stone-800/60">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-stone-100">
            Today's Schedule
          </h2>
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
            {done}/{schedule.length}
          </span>
        </div>
      </div>

      {/* Timeline items */}
      <div>
        {schedule.map((item, i) => {
          const config = typeConfig[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.055, duration: 0.35, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3 px-5 py-3.5 relative",
                item.active && "bg-amber-50/70 dark:bg-amber-950/20",
                item.done && "opacity-50",
                i < schedule.length - 1 && "border-b border-stone-50 dark:border-stone-800/50"
              )}
            >
              {/* Left border accent on active */}
              {item.active && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400 rounded-r" />
              )}

              {/* Time */}
              <span className="text-[11px] text-stone-400 dark:text-stone-500 w-10 shrink-0 pt-[3px] tabular-nums font-medium">
                {item.time}
              </span>

              {/* Dot + vertical line */}
              <div className="flex flex-col items-center shrink-0 pt-[3px]">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    item.done ? "bg-stone-300 dark:bg-stone-600" : config.dot,
                    item.active && "ring-[3px] ring-offset-1 ring-amber-300 dark:ring-amber-700"
                  )}
                />
                {i < schedule.length - 1 && (
                  <div className="w-px flex-1 min-h-[20px] bg-stone-100 dark:bg-stone-800 mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[14px] font-semibold leading-snug",
                      item.done
                        ? "line-through text-stone-400 dark:text-stone-600"
                        : "text-zinc-900 dark:text-stone-100"
                    )}
                  >
                    {item.title}
                  </p>
                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    {item.active && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                    {item.done ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                        <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    ) : !item.active ? (
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", config.color)}>
                        {config.label}
                      </span>
                    ) : null}
                  </div>
                </div>
                {item.notes && (
                  <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5 leading-relaxed">
                    {item.notes}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
