"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { child, schedule, focusAreas } from "@/lib/data/demo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FocusArea } from "@/lib/data/demo";

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

interface Props {
  focus: FocusArea;
  onFocusChange: (f: FocusArea) => void;
}

export default function ChildProfileHeader({ focus, onFocusChange }: Props) {
  const [greeting, setGreeting] = useState({ text: "Good morning", emoji: "☀️" });
  const [today, setToday] = useState("");
  const [focusOpen, setFocusOpen] = useState(false);

  useEffect(() => {
    setGreeting(getGreeting());
    setToday(formatToday());
  }, []);

  const done = schedule.filter((s) => s.done).length;
  const total = schedule.length;

  const selectedArea = focusAreas.find((f) => f.id === focus) ?? focusAreas[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="px-5 pt-10 pb-8 bg-gradient-to-b from-amber-50/90 via-amber-50/30 to-transparent dark:from-amber-950/30 dark:via-stone-950/10 dark:to-transparent"
    >
      {/* Date line */}
      <p className="text-[11px] font-semibold text-amber-600/50 dark:text-amber-500/40 tracking-widest uppercase mb-1.5">
        {today}
      </p>

      {/* Greeting */}
      <h1 className="text-[28px] font-extrabold text-foreground tracking-tight leading-none mb-6">
        {greeting.text} {greeting.emoji}
      </h1>

      {/* Child card */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-[72px] h-[72px] rounded-[1.5rem] bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-900/80 dark:to-orange-900/60 flex items-center justify-center text-[34px] shadow-elevated ring-[3px] ring-amber-200/60 dark:ring-amber-800/30">
            {child.emoji}
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-surface-card shadow-card flex items-center justify-center text-sm border-soft">
            {child.mood}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[25px] font-bold text-foreground tracking-tight leading-none">
            {child.name}
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5 font-medium">
            {child.age} · {child.moodLabel}
          </p>
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            <button
              onClick={() => setFocusOpen((v) => !v)}
              className="active:scale-[0.96] transition-transform"
            >
              <Badge className="bg-amber-100/80 text-amber-800 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/40 text-[11px] font-semibold h-6 rounded-full cursor-pointer">
                {selectedArea.emoji} {selectedArea.label}
              </Badge>
            </button>
            <Badge className="bg-sky-100/80 text-sky-700 border-sky-200/60 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900/40 text-[11px] font-semibold h-6 rounded-full">
              ☀️ Sunny · 72°
            </Badge>
          </div>
        </div>
      </div>

      {/* Focus selector */}
      <AnimatePresence>
        {focusOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-black/5 dark:border-white/8">
              {focusAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => { onFocusChange(area.id); setFocusOpen(false); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-[0.96]",
                    area.id === focus
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <span>{area.emoji}</span>
                  {area.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar — no label, speaks for itself */}
      <div className="mt-6">
        <div className="h-[3px] bg-black/6 dark:bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${(done / total) * 100}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
      </div>
    </motion.div>
  );
}
