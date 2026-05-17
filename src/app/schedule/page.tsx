"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { schedule as demoSchedule, typeConfig, demoPatterns } from "@/lib/data/demo";
import { supabase } from "@/lib/supabase/client";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";
import DatePicker from "@/components/memory/DatePicker";
import { PatternCard } from "@/components/insights/PatternCard";

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  type: keyof typeof typeConfig;
  done: boolean;
  active: boolean;
  notes: string;
};

function normalize(raw: Record<string, unknown>): ScheduleItem {
  return {
    id: String(raw.id ?? ""),
    time: String(raw.time ?? ""),
    title: String(raw.title ?? ""),
    type: (raw.type ?? "play") as keyof typeof typeConfig,
    done: Boolean(raw.done ?? false),
    active: Boolean(raw.active ?? false),
    notes: String(raw.notes ?? ""),
  };
}

const todayStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("schedule_items").select("*").then(({ data }) => {
      const raw = data && data.length > 0 ? data : demoSchedule;
      setItems((raw as Record<string, unknown>[]).map(normalize));
    });
  }, []);

  function handleSelectDay(date: string) {
    setSelectedDate(date === "Today" ? null : date);
  }

  const isPastDay = selectedDate !== null;

  // For past days we show the full schedule as a historical snapshot
  const displayItems = isPastDay
    ? items.map((i) => ({ ...i, done: true, active: false }))
    : items;

  const completed = displayItems.filter((i) => i.done);
  const upcoming = displayItems.filter((i) => !i.done);

  const headerDate = isPastDay ? selectedDate : todayStr;

  return (
    <div className="min-h-screen bg-surface-page">
      <DatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectDay={handleSelectDay}
        dayOnly
        title="Schedule"
      />

      {/* Header */}
      <div
        className="px-5 pt-9 pb-4 sticky top-0 z-10 backdrop-blur-2xl border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-start justify-between mb-1">
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-end gap-1.5 group text-left"
          >
            <h1 className="text-[26px] font-extrabold text-foreground tracking-tight leading-none">
              {headerDate}
            </h1>
            <CalendarDays
              size={14}
              className="text-muted-foreground/35 group-hover:text-muted-foreground/60 transition-colors mb-0.5 shrink-0"
            />
          </button>
        </div>

        {!isPastDay ? (
          <p className="text-[12px] font-medium text-muted-foreground/45 mt-1.5">
            Mateo&apos;s day · with Elena
          </p>
        ) : (
          <button
            onClick={() => setSelectedDate(null)}
            className="flex items-center gap-1 mt-2 text-[13px] font-semibold text-muted-foreground active:opacity-60 transition-opacity"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            Back to Today
          </button>
        )}

        {/* Ambient pattern — fades in below header */}
        <section className="pt-2">
          <PatternCard pattern={demoPatterns[0]} compact />
        </section>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate ?? "today"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="p-4 space-y-6"
        >
          {isPastDay ? (
            <section>
              <p className="text-[11px] font-semibold text-muted-foreground/50 tracking-wide px-1 mb-3">
                {selectedDate}
              </p>
              <div className="space-y-2">
                {displayItems.map((item) => (
                  <ScheduleBlock key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <p className="text-[11px] font-semibold text-muted-foreground/45 tracking-wide px-1 mb-3">
                    Coming up
                  </p>
                  <div className="space-y-2">
                    {upcoming.map((item) => (
                      <ScheduleBlock key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
              {completed.length > 0 && (
                <section>
                  <p className="text-[11px] font-semibold text-muted-foreground/45 tracking-wide px-1 mb-3">
                    Earlier today
                  </p>
                  <div className="space-y-2">
                    {completed.map((item) => (
                      <ScheduleBlock key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
