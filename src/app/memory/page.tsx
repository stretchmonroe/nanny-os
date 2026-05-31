"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import JournalSummary from "@/components/memory/JournalSummary";
import TodayJournal from "@/components/memory/TodayJournal";
import WeekView from "@/components/memory/WeekView";
import FavoritesView from "@/components/memory/FavoritesView";
import PhotoUploader from "@/components/memory/PhotoUploader";
import NoteComposeSheet from "@/components/memory/NoteComposeSheet";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import { supabase } from "@/lib/supabase/client";
import { useAppStore as useStore } from "@/store/useAppStore";
import { notifyHousehold } from "@/lib/push/notify";
import type { VoiceResult } from "@/lib/voice/transcriptParser";

type Tab = "today" | "week" | "favorites";

const tabs: { label: string; value: Tab }[] = [
  { label: "Today",     value: "today"     },
  { label: "This Week", value: "week"       },
  { label: "Favorites", value: "favorites" },
];

const dateStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month:   "long",
  day:     "numeric",
});

export default function MemoryPage() {
  const [tab,        setTab]        = useState<Tab>("today");
  const [refreshKey, setRefreshKey] = useState(0);
  const [composing,  setComposing]  = useState(false);
  const activeChild     = useAppStore((s) => s.activeChild);
  const currentUserRole = useStore((s) => s.currentUserRole);
  const profileFullName = useStore((s) => s.profileFullName);

  const childId    = activeChild?.id ?? null;
  const childName  = activeChild?.name ?? null;
  const childLabel = activeChild ? activeChild.name : "Mateo · 18 months";

  function refresh() {
    setTab("today");
    setRefreshKey((k) => k + 1);
  }

  async function handleVoiceSave(result: VoiceResult) {
    if (result.type !== "memory") return;
    await supabase.from("memory_events").insert({
      type:       "note",
      content:    result.content,
      category:   result.category,
      child_id:   childId ?? "default",
      created_by: currentUserRole ?? "nanny",
      created_at: new Date().toISOString(),
    });
    if (childId && childId !== "default") {
      notifyHousehold({ childId, childName, senderRole: currentUserRole ?? "nanny", senderName: profileFullName, eventType: "note" });
    }
    refresh();
  }

  return (
    <div className="min-h-screen bg-surface-page">

      {/* Header */}
      <div
        className="px-5 pt-9 pb-4 sticky top-0 z-10 backdrop-blur-2xl"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[30px] font-extrabold text-foreground tracking-tight leading-none mb-1.5">
              {dateStr}
            </h1>
            <p className="text-[11px] font-semibold text-muted-foreground/45 uppercase tracking-widest">
              {childLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <VoiceRecorder context="memory" onSave={handleVoiceSave} className="w-9 h-9" />
            {/* Note compose */}
            <button
              onClick={() => setComposing(true)}
              className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform"
            >
              <PenLine size={15} className="text-muted-foreground" />
            </button>
            <PhotoUploader childId={childId} childName={childName} onUpload={refresh} />
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1.5">
          {tabs.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 active:scale-[0.96]",
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
          transition={{ duration: 0.2 }}
        >
          {tab === "today" && (
            <div>
              <div className="pt-3">
                <JournalSummary childId={childId} />
              </div>
              <TodayJournal childId={childId} refreshKey={refreshKey} />
            </div>
          )}
          {tab === "week"      && <div className="pt-4"><WeekView childId={childId} /></div>}
          {tab === "favorites" && <FavoritesView childId={childId} />}
        </motion.div>
      </AnimatePresence>

      {/* Note compose sheet */}
      <NoteComposeSheet
        open={composing}
        childId={childId}
        childName={childName}
        onClose={() => setComposing(false)}
        onSaved={refresh}
      />
    </div>
  );
}
