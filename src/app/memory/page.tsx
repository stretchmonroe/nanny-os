"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import JournalSummary from "@/components/memory/JournalSummary";
import TodayJournal from "@/components/memory/TodayJournal";
import WeekView from "@/components/memory/WeekView";
import FavoritesView from "@/components/memory/FavoritesView";
import PhotoUploader from "@/components/memory/PhotoUploader";

type Tab = "today" | "week" | "favorites";

const tabs: { label: string; value: Tab }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Favorites", value: "favorites" },
];

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      {/* Sticky header */}
      <div className="px-5 pt-6 pb-4 bg-[#FDFBF7]/90 dark:bg-[#1A1714]/90 backdrop-blur-xl sticky top-0 z-10 border-b border-stone-100 dark:border-stone-800/60">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[24px] font-bold text-zinc-900 dark:text-stone-100 tracking-tight">
              Journal
            </h1>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              Mateo&rsquo;s story, day by day
            </p>
          </div>
          <PhotoUploader />
        </div>

        {/* Tab pills */}
        <div className="flex gap-2">
          {tabs.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95",
                tab === value
                  ? "bg-zinc-900 dark:bg-stone-100 text-white dark:text-zinc-900"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pt-5"
        >
          {tab === "today" && (
            <div className="space-y-4">
              <JournalSummary />
              <TodayJournal />
            </div>
          )}
          {tab === "week" && <WeekView />}
          {tab === "favorites" && <FavoritesView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
