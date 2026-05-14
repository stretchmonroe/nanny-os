"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import WeeklyInsightCard from "./WeeklyInsightCard";

const catEmoji: Record<string, string> = {
  outdoor: "🌳",
  learning: "📚",
  play: "🎈",
  meal: "🍽️",
  nap: "💤",
};

export default function WeekView() {
  return (
    <div className="px-4 pb-8 space-y-7">
      <WeeklyInsightCard />
      {weeklyMoments.map((dayData, dayIndex) => (
        <motion.div
          key={dayData.day}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIndex * 0.07, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Day header */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className={cn(
                "text-[11px] font-bold tracking-widest uppercase",
                dayData.isToday
                  ? "text-amber-500"
                  : "text-stone-400 dark:text-stone-500"
              )}
            >
              {dayData.day}
            </span>
            <div className="h-px flex-1 bg-stone-200 dark:bg-stone-700/60" />
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {dayData.date}
            </span>
          </div>

          {/* Moments */}
          <div className="space-y-2">
            {dayData.moments.map((moment) => (
              <div
                key={moment.id}
                className="flex items-center gap-3 bg-white dark:bg-stone-800/70 rounded-2xl p-3 shadow-sm border border-stone-100 dark:border-stone-700/40"
              >
                {/* Thumbnail or emoji */}
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-700 flex items-center justify-center">
                  {moment.imageUrl ? (
                    <Image
                      src={moment.imageUrl}
                      alt={moment.content}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-2xl">
                      {moment.type === "milestone"
                        ? "⭐"
                        : catEmoji[moment.category] ?? "📝"}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-800 dark:text-stone-100 leading-snug line-clamp-2">
                    {moment.content}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                    {moment.time}
                  </p>
                </div>

                {/* Milestone star */}
                {moment.type === "milestone" && (
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <span className="text-xs">⭐</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
