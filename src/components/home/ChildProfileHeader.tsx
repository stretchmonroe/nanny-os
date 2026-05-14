"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { child, schedule } from "@/lib/data/demo";
import { Badge } from "@/components/ui/badge";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤" };
  return { text: "Good evening", emoji: "🌙" };
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ChildProfileHeader() {
  const [greeting, setGreeting] = useState({ text: "Good morning", emoji: "☀️" });
  const [today, setToday] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setToday(formatToday());
  }, []);

  const done = schedule.filter((s) => s.done).length;
  const total = schedule.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="px-5 pt-6 pb-5 bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-transparent dark:from-stone-900 dark:via-stone-950/50 dark:to-transparent"
    >
      {/* Date + greeting */}
      <div className="mb-4">
        <p className="text-xs text-stone-400 dark:text-stone-500 font-medium tracking-wide uppercase">
          {today}
        </p>
        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-stone-100 tracking-tight mt-0.5">
          {greeting.text} {greeting.emoji}
        </h1>
      </div>

      {/* Child info */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-[62px] h-[62px] rounded-full bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center text-[30px] shadow-lg ring-4 ring-white/70 dark:ring-stone-800/70">
            {child.emoji}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-stone-800 flex items-center justify-center shadow-sm text-sm border border-stone-100 dark:border-stone-700">
            {child.mood}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-zinc-900 dark:text-stone-100 tracking-tight leading-none">
            {child.name}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {child.age} · {child.moodLabel}
          </p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50 text-[11px] py-0.5 font-medium">
              🎯 {child.focus}
            </Badge>
            <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/50 text-[11px] py-0.5 font-medium">
              ☀️ Sunny
            </Badge>
          </div>
        </div>
      </div>

      {/* Day progress */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">Day progress</p>
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
            {done} of {total} activities
          </p>
        </div>
        <div className="h-1.5 bg-stone-200/80 dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${(done / total) * 100}%` }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}
