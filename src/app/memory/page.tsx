"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import JournalSummary from "@/components/memory/JournalSummary";
import TodayJournal from "@/components/memory/TodayJournal";
import WeekView from "@/components/memory/WeekView";
import FavoritesView from "@/components/memory/FavoritesView";
import PhotoUploader from "@/components/memory/PhotoUploader";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import { supabase } from "@/lib/supabase/client";
import type { VoiceResult } from "@/lib/voice/transcriptParser";

type Tab = "today" | "week" | "favorites";

const tabs: { label: string; value: Tab }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Favorites", value: "favorites" },
];

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>("today");

  async function handleVoiceSave(result: VoiceResult) {
    if (result.type !== "memory") return;
    await supabase.from("memory_events").insert({
      type: "note",
      content: result.content,
      category: result.category,
      child_id: "default",
      created_by: "nanny",
      created_at: new Date().toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Sticky header */}
      <div
        className="px-5 pt-7 pb-4 sticky top-0 z-10 border-b border-soft backdrop-blur-2xl"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
              Journal
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
              Mateo&rsquo;s story, day by day
            </p>
          </div>
          <div className="flex items-center gap-2">
            <VoiceRecorder context="memory" onSave={handleVoiceSave} className="w-9 h-9" />
            <PhotoUploader />
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1.5">
          {tabs.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200 active:scale-[0.96]",
                tab === value
                  ? "bg-foreground text-background shadow-card"
                  : "bg-muted text-muted-foreground"
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
