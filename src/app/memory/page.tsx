"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { NavMenuButton } from "@/components/layout/NavMenuButton";
import { cn } from "@/lib/utils";
import JournalSummary from "@/components/memory/JournalSummary";
import TodayJournal from "@/components/memory/TodayJournal";
import WeekView from "@/components/memory/WeekView";
import FavoritesView from "@/components/memory/FavoritesView";
import PastDayView from "@/components/memory/PastDayView";
import PastWeekView from "@/components/memory/PastWeekView";
import DatePicker from "@/components/memory/DatePicker";
import PhotoUploader from "@/components/memory/PhotoUploader";
import OnThisDay from "@/components/memory/OnThisDay";
import DevelopmentStory from "@/components/memory/DevelopmentStory";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import VoiceMemorySheet from "@/components/memory/VoiceMemorySheet";
import { supabase } from "@/lib/supabase/client";
import type { VoiceResult } from "@/lib/voice/transcriptParser";
import type { JournalMoment } from "@/lib/data/demo";
import { ArrowUp } from "lucide-react";

type Tab = "today" | "week" | "favorites";

type View =
  | { type: "tab"; tab: Tab }
  | { type: "day"; date: string }
  | { type: "week"; label: string; range: string; dates: string[] };

const tabs: { label: string; value: Tab }[] = [
  { label: "Today",     value: "today"     },
  { label: "This Week", value: "week"       },
  { label: "Cherished", value: "favorites" },
];

const todayStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month:   "long",
  day:     "numeric",
});

const NOTE_EMOJIS = ["😄", "🌿", "⭐", "🎯", "🍼", "💛"];

function QuickWrite() {
  const [text,          setText]          = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSave = text.trim().length > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    const content = selectedEmoji ? `${selectedEmoji} ${text.trim()}` : text.trim();
    await supabase.from("memory_events").insert({
      type: "note", content, child_id: "default", created_by: "parent",
      created_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    navigator.vibrate?.(40);
    setTimeout(() => { setSaved(false); setText(""); setSelectedEmoji(""); }, 1200);
  }

  return (
    <div
      className="mx-4 mt-4 mb-1 rounded-2xl px-4 pt-3.5 pb-4"
      style={{ background: "var(--surface-card)", border: "1.5px solid var(--border-soft)" }}
    >
      {/* Emoji chips */}
      <div className="flex gap-2 mb-3">
        {NOTE_EMOJIS.map(e => (
          <motion.button
            key={e}
            whileTap={{ scale: 0.88 }}
            onClick={() => setSelectedEmoji(e === selectedEmoji ? "" : e)}
            className="w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-all duration-150"
            style={{
              background: e === selectedEmoji ? "var(--accent-light)" : "var(--surface-page)",
              border:     `1.5px solid ${e === selectedEmoji ? "var(--accent-primary)" : "transparent"}`,
            }}
          >
            {e}
          </motion.button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="A moment worth remembering…"
          rows={2}
          className="flex-1 resize-none text-[14px] text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic font-medium"
        />
        <motion.button
          onClick={handleSave}
          disabled={!canSave || saving || saved}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-0.5 transition-all duration-150"
          style={{
            background: saved ? "#5BC8A8" : canSave ? "var(--accent-primary)" : "var(--border-medium)",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saved ? (
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5L5 9.5L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <ArrowUp size={16} strokeWidth={2.5} className="text-white" />
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default function MemoryPage() {
  const [view, setView] = useState<View>({ type: "tab", tab: "today" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [voiceSheetOpen, setVoiceSheetOpen] = useState(false);
  const [localMoments, setLocalMoments] = useState<JournalMoment[]>([]);

  function handleAudioSave(moment: Omit<JournalMoment, "id">) {
    const newMoment: JournalMoment = { ...moment, id: `local_${Date.now()}` };
    setLocalMoments(prev => [newMoment, ...prev]);
  }

  async function handleVoiceSave(result: VoiceResult) {
    if (result.type !== "memory") return;
    await supabase.from("memory_events").insert({
      type:       "note",
      content:    result.content,
      category:   result.category,
      child_id:   "default",
      created_by: "nanny",
      created_at: new Date().toISOString(),
    });
  }

  function handleSelectDay(date: string) {
    if (date === "Today") {
      setView({ type: "tab", tab: "today" });
    } else {
      setView({ type: "day", date });
    }
  }

  function handleSelectWeek(label: string, range: string, dates: string[]) {
    if (label === "This week") {
      setView({ type: "tab", tab: "week" });
    } else {
      setView({ type: "week", label, range, dates });
    }
  }

  const isPastView = view.type !== "tab";
  const currentTab = view.type === "tab" ? view.tab : "today";

  const headerTitle =
    view.type === "day"
      ? view.date
      : view.type === "week"
      ? `${view.label} · ${view.range}`
      : todayStr;

  const viewKey =
    view.type === "tab"
      ? `tab-${view.tab}`
      : view.type === "day"
      ? `day-${view.date}`
      : `week-${view.label}`;

  return (
    <div className="min-h-screen bg-surface-page">
      <VoiceMemorySheet
        open={voiceSheetOpen}
        onClose={() => setVoiceSheetOpen(false)}
        onSave={handleAudioSave}
      />

      <DatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectDay={handleSelectDay}
        onSelectWeek={handleSelectWeek}
      />

      {/* Header */}
      <div
        className="px-5 pt-9 pb-4 sticky top-0 z-10 backdrop-blur-2xl"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-end justify-between mb-5">
          <div className="min-w-0 flex-1 mr-3 flex items-start gap-2.5">
            <NavMenuButton className="mt-0.5 -ml-1.5 shrink-0" />
            <div className="min-w-0 flex-1">
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-end gap-1.5 group text-left w-full"
            >
              <h1 className="text-[28px] font-extrabold text-foreground tracking-tight leading-none mb-1.5 truncate">
                {headerTitle}
              </h1>
              <CalendarDays
                size={15}
                className="text-muted-foreground/35 group-hover:text-muted-foreground/60 transition-colors mb-2 shrink-0"
              />
            </button>
            <p className="text-[11px] font-medium text-muted-foreground/40">
              Mateo&apos;s story · 18 months
            </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-0.5 shrink-0">
            <VoiceRecorder context="memory" onSave={handleVoiceSave} className="w-9 h-9" />
            {/* Voice memory recorder */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setVoiceSheetOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
              aria-label="Record voice memory"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" className="text-foreground/60" />
                <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" className="text-foreground/60" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" className="text-foreground/60" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" className="text-foreground/60" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.button>
            <PhotoUploader />
          </div>
        </div>

        {/* Tab pills or back button */}
        {!isPastView ? (
          <div className="flex gap-1.5">
            {tabs.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setView({ type: "tab", tab: value })}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 active:scale-[0.96]",
                  currentTab === value
                    ? "bg-foreground text-background shadow-card"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setView({ type: "tab", tab: "today" })}
            className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={15} strokeWidth={2.5} />
            Back to Today
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {view.type === "tab" && view.tab === "today" && (
            <div>
              <QuickWrite />
              <div className="mt-3">
                <OnThisDay />
              </div>
              <div className="pt-1">
                <JournalSummary />
              </div>
              <div className="mt-3 mb-1">
                <DevelopmentStory />
              </div>
              <TodayJournal extras={localMoments} />
            </div>
          )}
          {view.type === "tab" && view.tab === "week"      && <div className="pt-4"><WeekView /></div>}
          {view.type === "tab" && view.tab === "favorites" && <FavoritesView />}
          {view.type === "day"  && <PastDayView date={view.date} />}
          {view.type === "week" && (
            <PastWeekView weekLabel={view.label} range={view.range} dates={view.dates} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
