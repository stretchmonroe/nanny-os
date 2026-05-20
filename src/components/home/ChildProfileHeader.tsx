"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { demoChildren, schedule, focusAreas } from "@/lib/data/demo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NavMenuButton } from "@/components/layout/NavMenuButton";
import { ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import ChildSwitcherSheet from "@/components/home/ChildSwitcherSheet";
import type { FocusArea } from "@/lib/data/demo";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  });
}

interface Props {
  focus:          FocusArea;
  onFocusChange:  (f: FocusArea) => void;
  onProfileOpen(): void;
}

export default function ChildProfileHeader({ focus, onFocusChange, onProfileOpen }: Props) {
  const [greeting,      setGreeting]      = useState("Good morning");
  const [today,         setToday]         = useState("");
  const [focusOpen,     setFocusOpen]     = useState(false);
  const [switcherOpen,  setSwitcherOpen]  = useState(false);

  const { activeChildId, setActiveChildId } = useAppStore();
  const activeChild = demoChildren.find(c => c.id === activeChildId) ?? demoChildren[0];
  const multiChild  = demoChildren.length > 1;

  useEffect(() => {
    setGreeting(getGreeting());
    setToday(formatToday());
  }, []);

  const done  = schedule.filter(s => s.done).length;
  const total = schedule.length;
  const selectedArea = focusAreas.find(f => f.id === focus) ?? focusAreas[0];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        className="px-5 pt-10 pb-7 bg-gradient-to-b from-[#F0E8D8]/80 via-[#F4EDE0]/30 to-transparent dark:from-amber-950/20 dark:via-stone-950/8 dark:to-transparent"
      >
        {/* Top row: hamburger + date + avatar */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <NavMenuButton className="-ml-1.5" />
            <p className="text-[11px] font-semibold text-amber-600/50 dark:text-amber-500/35 tracking-widest uppercase pt-0.5">
              {today}
            </p>
          </div>

          {/* Avatar — tappable, opens profile */}
          <button
            onClick={onProfileOpen}
            className="relative active:scale-[0.94] transition-transform"
          >
            <div
              className="w-14 h-14 rounded-[1.3rem] flex items-center justify-center text-[28px] shadow-elevated ring-[3px] ring-[#D4A882]/30"
              style={{
                background: `linear-gradient(135deg, ${activeChild.avatarFrom}, ${activeChild.avatarTo})`,
              }}
            >
              {activeChild.emoji}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-xl bg-surface-card shadow-card flex items-center justify-center text-[13px] border-soft">
              {activeChild.mood}
            </div>
          </button>
        </div>

        {/* Hero editorial block */}
        <div className="mb-5">
          <p className="text-[15px] font-medium text-foreground/45 dark:text-foreground/35 mb-0.5 tracking-tight">
            {greeting}
          </p>

          {/* Child name — switcher trigger */}
          <button
            onClick={() => multiChild && setSwitcherOpen(true)}
            className={cn(
              "flex items-end gap-2 text-left",
              multiChild && "active:opacity-70 transition-opacity"
            )}
            disabled={!multiChild}
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={activeChild.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="text-[38px] font-black text-foreground tracking-tight leading-[0.92]"
              >
                {activeChild.name}
              </motion.h1>
            </AnimatePresence>
            {multiChild && (
              <ChevronDown
                size={18}
                strokeWidth={2.5}
                className="text-foreground/20 mb-[5px] shrink-0"
              />
            )}
          </button>

          <p className="text-[13px] text-muted-foreground mt-2 font-medium">
            {activeChild.age} · {activeChild.moodLabel}
          </p>
          <p className="text-[11px] text-muted-foreground/40 mt-1 font-medium">
            with Elena today
          </p>
        </div>

        {/* Focus + weather badges */}
        <div className="flex gap-1.5 flex-wrap mb-1">
          <button
            onClick={() => setFocusOpen(v => !v)}
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

        {/* Focus selector */}
        <AnimatePresence>
          {focusOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
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

        {/* Ambient day rhythm bar */}
        <div className="mt-6">
          <p className="text-[10px] font-medium text-muted-foreground/30 mb-2 tracking-widest uppercase">
            Day&apos;s rhythm
          </p>
          <div className="h-[3px] bg-black/5 dark:bg-white/7 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ duration: 1.4, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
        </div>
      </motion.div>

      {/* Child switcher sheet */}
      <ChildSwitcherSheet
        open={switcherOpen}
        activeChildId={activeChildId}
        onSelect={setActiveChildId}
        onClose={() => setSwitcherOpen(false)}
      />
    </>
  );
}
