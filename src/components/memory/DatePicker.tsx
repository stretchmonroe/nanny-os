"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { recentMemories } from "@/lib/data/demo";

type PickerMode = "day" | "week";

const TODAY = { year: 2026, month: 5, day: 14 };
const FREE_LOOKBACK_MONTHS = 3;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Single-letter day headers matching native iOS/Android calendar
const DOW = ["S","M","T","W","T","F","S"];

const WEEKS = [
  { label: "This week", range: "May 8 – 14", dates: ["Today","May 13","May 12","May 11","May 10","May 9","May 8"] },
  { label: "Last week",  range: "May 1 – 7",  dates: ["May 7","May 6","May 5","May 4","May 3","May 2","May 1"] },
];

// "year-month-day" keys for days that have at least one memory
const DATA_DAYS = new Set<string>();
recentMemories.forEach((m) => {
  if (m.date === "Today") { DATA_DAYS.add(`${TODAY.year}-${TODAY.month}-${TODAY.day}`); return; }
  const parts = m.date.match(/^([A-Za-z]+)\s+(\d+)$/);
  if (parts) {
    const mo = MONTH_NAMES.indexOf(parts[1]) + 1;
    if (mo > 0) DATA_DAYS.add(`2026-${mo}-${parseInt(parts[2])}`);
  }
});

function isMonthLocked(year: number, month: number) {
  return (TODAY.year - year) * 12 + (TODAY.month - month) > FREE_LOOKBACK_MONTHS;
}

function isFutureDay(year: number, month: number, day: number) {
  if (year !== TODAY.year) return year > TODAY.year;
  if (month !== TODAY.month) return month > TODAY.month;
  return day > TODAY.day;
}

function toDateLabel(year: number, month: number, day: number) {
  if (year === TODAY.year && month === TODAY.month && day === TODAY.day) return "Today";
  return `${MONTH_NAMES[month - 1]} ${day}`;
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectDay: (date: string) => void;
  onSelectWeek?: (weekLabel: string, range: string, dates: string[]) => void;
  dayOnly?: boolean;
  title?: string;
}

export default function DatePicker({
  open, onClose, onSelectDay, onSelectWeek, dayOnly = false, title = "Browse",
}: Props) {
  const [mode, setMode] = useState<PickerMode>("day");
  const [viewYear, setViewYear] = useState(TODAY.year);
  const [viewMonth, setViewMonth] = useState(TODAY.month);

  const locked = isMonthLocked(viewYear, viewMonth);
  const isCurrentMonth = viewYear === TODAY.year && viewMonth === TODAY.month;
  const cells = buildCells(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (isCurrentMonth) return;
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/*
            Sheet: overflow-hidden so rounded corners clip content,
            no explicit height — grows to fit its content which is
            a predictable calendar grid (never needs to scroll on any phone).
          */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface-page rounded-t-[1.5rem] shadow-deep overflow-hidden"
          >
            {/* ── Drag handle ─────────────────────────────────────────── */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full bg-foreground/10" />
            </div>

            {/* ── Title + mode toggle ──────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 pb-2">
              <p className="text-[15px] font-bold text-foreground">{title}</p>
              {!dayOnly && (
                <div className="flex bg-muted rounded-full p-0.5">
                  {(["day","week"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150",
                        mode === m ? "bg-foreground text-background" : "text-muted-foreground"
                      )}
                    >
                      {m === "day" ? "Day" : "Week"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {/* ── Calendar (day) mode ──────────────────────────────────── */}
              {(dayOnly || mode === "day") ? (
                <motion.div
                  key="day"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  {/* Month navigation */}
                  <div className="flex items-center px-3 pb-1">
                    <button
                      onClick={prevMonth}
                      className="w-9 h-9 flex items-center justify-center rounded-full active:bg-muted transition-colors"
                    >
                      <ChevronLeft size={18} strokeWidth={2.5} className="text-foreground/60" />
                    </button>
                    <p className="flex-1 text-center text-[14px] font-semibold text-foreground">
                      {MONTH_NAMES[viewMonth - 1]} {viewYear}
                    </p>
                    <button
                      onClick={nextMonth}
                      disabled={isCurrentMonth}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                        isCurrentMonth ? "opacity-20 pointer-events-none" : "active:bg-muted"
                      )}
                    >
                      <ChevronRight size={18} strokeWidth={2.5} className="text-foreground/60" />
                    </button>
                  </div>

                  {/*
                    DOW headers and calendar cells share the SAME grid template
                    so columns are guaranteed to align. No wrapper divs with
                    flex/justify-center — buttons ARE the grid items.
                  */}
                  <div className="grid grid-cols-7 px-2">
                    {DOW.map((d, i) => (
                      <div key={i} className="h-8 flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-muted-foreground/40">{d}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid — relative so paywall overlay works */}
                  <div className="relative px-2" style={{ paddingBottom: "max(100px, calc(88px + env(safe-area-inset-bottom)))" }}>
                    <div className="grid grid-cols-7">
                      {cells.map((day, idx) => {
                        if (day === null) return <div key={`pad-${idx}`} className="h-10" />;

                        const dKey = `${viewYear}-${viewMonth}-${day}`;
                        const hasData = DATA_DAYS.has(dKey);
                        const future = isFutureDay(viewYear, viewMonth, day);
                        const isToday = viewYear === TODAY.year && viewMonth === TODAY.month && day === TODAY.day;
                        const tappable = !locked && !future;

                        return (
                          /*
                            Button fills the full grid column width × fixed row height.
                            Visual circle is the inner span — this matches native iOS/Android
                            calendar exactly (full column touch target, smaller visual).
                          */
                          <button
                            key={dKey}
                            onClick={() => {
                              if (tappable) { onSelectDay(toDateLabel(viewYear, viewMonth, day)); onClose(); }
                            }}
                            disabled={!tappable}
                            className={cn(
                              "h-10 flex items-center justify-center transition-opacity",
                              !tappable && "pointer-events-none"
                            )}
                          >
                            <span className={cn(
                              "relative w-8 h-8 rounded-full flex items-center justify-center",
                              isToday    && "bg-amber-400 dark:bg-amber-500",
                              !isToday && future  && "opacity-20",
                              !isToday && !future && !hasData && "opacity-30",
                            )}>
                              <span className={cn(
                                "text-[13px] leading-none select-none",
                                isToday ? "font-bold text-white" : hasData && !future ? "font-semibold text-foreground" : "text-foreground"
                              )}>
                                {day}
                              </span>
                              {hasData && !isToday && !future && (
                                <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-amber-400 dark:bg-amber-500" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Paywall overlay */}
                    {locked && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-surface-page/95 backdrop-blur-sm"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/30 flex items-center justify-center mb-2.5">
                          <Lock size={16} className="text-amber-500" />
                        </div>
                        <p className="text-[14px] font-bold text-foreground mb-1">Memory Archive</p>
                        <p className="text-[12px] text-muted-foreground text-center mb-4 max-w-[190px] leading-snug">
                          More than 3 months back requires Premium
                        </p>
                        <button className="px-5 py-2 rounded-full bg-amber-400 text-white text-[12px] font-bold active:scale-95 transition-transform">
                          Upgrade to Premium
                        </button>
                        <button onClick={nextMonth} className="mt-2.5 text-[11px] text-muted-foreground/55 font-medium">
                          Go back
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* ── Week mode ──────────────────────────────────────────── */
                <motion.div
                  key="week"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="px-4 space-y-2"
                  style={{ paddingBottom: "max(100px, calc(88px + env(safe-area-inset-bottom)))" }}
                >
                  {WEEKS.map((week) => (
                    <button
                      key={week.label}
                      onClick={() => { onSelectWeek?.(week.label, week.range, week.dates); onClose(); }}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-muted active:scale-[0.98] transition-all"
                    >
                      <div className="text-left">
                        <p className="text-[14px] font-semibold text-foreground">{week.label}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{week.range}</p>
                      </div>
                      <ChevronRight size={15} className="text-muted-foreground/30" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
