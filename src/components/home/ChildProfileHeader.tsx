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
  const pct = Math.round((done / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="px-5 pt-7 pb-6 bg-gradient-to-b from-amber-50/70 via-orange-50/20 to-transparent dark:from-amber-950/25 dark:via-stone-900/10 dark:to-transparent"
    >
      {/* Date line */}
      <p className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase mb-1.5">
        {today}
      </p>

      {/* Greeting */}
      <h1 className="text-[26px] font-extrabold text-foreground tracking-tight leading-none mb-5">
        {greeting.text} {greeting.emoji}
      </h1>

      {/* Child card */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-[66px] h-[66px] rounded-[1.4rem] bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-900/80 dark:to-orange-900/60 flex items-center justify-center text-[32px] shadow-elevated ring-2 ring-white/60 dark:ring-white/10">
            {child.emoji}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-surface-card shadow-card flex items-center justify-center text-sm border-soft">
            {child.mood}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[24px] font-bold text-foreground tracking-tight leading-none">
            {child.name}
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5 font-medium">
            {child.age} · {child.moodLabel}
          </p>
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            <Badge className="bg-amber-100/80 text-amber-800 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/40 text-[11px] font-semibold h-6 rounded-full">
              🎯 {child.focus}
            </Badge>
            <Badge className="bg-sky-100/80 text-sky-700 border-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/40 text-[11px] font-semibold h-6 rounded-full">
              ☀️ Sunny · 72°
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Day progress
          </p>
          <p className="text-[11px] font-bold text-foreground tabular-nums">
            {done}/{total} · {pct}%
          </p>
        </div>
        <div className="h-1.5 bg-black/6 dark:bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${(done / total) * 100}%` }}
            transition={{ duration: 1.0, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}
