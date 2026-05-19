"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, Plus, X, Check } from "lucide-react";
import { NavMenuButton } from "@/components/layout/NavMenuButton";
import { schedule as demoSchedule, typeConfig, demoPatterns } from "@/lib/data/demo";
import { supabase } from "@/lib/supabase/client";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";
import DatePicker from "@/components/memory/DatePicker";
import { PatternCard } from "@/components/insights/PatternCard";
import { cn } from "@/lib/utils";

type ScheduleItem = {
  id:    string;
  time:  string;
  title: string;
  type:  keyof typeof typeConfig;
  done:  boolean;
  active: boolean;
  notes: string;
};

function normalize(raw: Record<string, unknown>): ScheduleItem {
  return {
    id:     String(raw.id ?? ""),
    time:   String(raw.time ?? ""),
    title:  String(raw.title ?? ""),
    type:   (raw.type ?? "play") as keyof typeof typeConfig,
    done:   Boolean(raw.done ?? false),
    active: Boolean(raw.active ?? false),
    notes:  String(raw.notes ?? ""),
  };
}

const todayStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month:   "long",
  day:     "numeric",
});

const TYPE_OPTIONS = (Object.keys(typeConfig) as (keyof typeof typeConfig)[]).filter(
  k => k !== "play" ? true : true,
);

// ── Edit / Add Sheet ───────────────────────────────────────────────────────────

interface EditSheetProps {
  open:     boolean;
  item?:    ScheduleItem | null;
  onClose(): void;
  onSave(item: Partial<ScheduleItem> & { id?: string }): void;
}

function EditSheet({ open, item, onClose, onSave }: EditSheetProps) {
  const isNew = !item;
  const [title, setTitle] = useState(item?.title ?? "");
  const [time,  setTime]  = useState(item?.time  ?? "");
  const [type,  setType]  = useState<keyof typeof typeConfig>(item?.type ?? "play");
  const [notes, setNotes] = useState(item?.notes ?? "");

  // Sync when item changes (reopened for edit)
  useEffect(() => {
    if (open) {
      setTitle(item?.title ?? "");
      setTime(item?.time   ?? "");
      setType(item?.type   ?? "play");
      setNotes(item?.notes ?? "");
    }
  }, [open, item]);

  function handleSave() {
    if (!title.trim() || !time.trim()) return;
    onSave({
      id:    item?.id,
      title: title.trim(),
      time:  time.trim(),
      type,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="edit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.div
            key="edit-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto rounded-t-[2rem] px-5 pt-4 pb-10"
            style={{ background: "var(--surface-card)" }}
          >
            {/* Handle */}
            <div className="w-9 h-1 rounded-full mx-auto mb-5 opacity-20"
              style={{ background: "var(--text-primary)" }} />

            <div className="flex items-center justify-between mb-5">
              <p className="text-[17px] font-bold text-foreground">
                {isNew ? "Add to today" : "Edit activity"}
              </p>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.07)" }}
              >
                <X size={12} strokeWidth={2.2} className="text-foreground/40" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5 block">
                  Activity name
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Playground run"
                  className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground outline-none"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
                  autoFocus
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5 block">
                  Time
                </label>
                <input
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground outline-none"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5 block">
                  Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TYPE_OPTIONS.map(k => {
                    const cfg = typeConfig[k];
                    const selected = k === type;
                    return (
                      <motion.button
                        key={k}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setType(k)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all",
                          selected ? "text-white" : "text-foreground/60"
                        )}
                        style={{
                          background: selected ? "var(--foreground)" : "var(--surface-raised)",
                          border: `1.5px solid ${selected ? "transparent" : "var(--border-soft)"}`,
                        }}
                      >
                        {cfg.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5 block">
                  Notes <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any details or reminders…"
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground outline-none resize-none"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!title.trim() || !time.trim()}
              className="mt-5 w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              <Check size={15} strokeWidth={2.2} />
              {isNew ? "Add activity" : "Save changes"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [items,        setItems]        = useState<ScheduleItem[]>([]);
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingItem,   setEditingItem]  = useState<ScheduleItem | null>(null);

  useEffect(() => {
    supabase.from("schedule_items").select("*").then(({ data }) => {
      const raw = data && data.length > 0 ? data : demoSchedule;
      setItems((raw as Record<string, unknown>[]).map(normalize));
    });
  }, []);

  function handleSelectDay(date: string) {
    setSelectedDate(date === "Today" ? null : date);
  }

  async function handleToggleDone(id: string) {
    const item = items.find(i => i.id === id);
    if (!item || isPastDay) return;
    const newDone = !item.done;
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: newDone, active: newDone ? false : i.active } : i));
    await supabase.from("schedule_items").update({ done: newDone, active: newDone ? false : item.active }).eq("id", id);
  }

  function openAdd() {
    setEditingItem(null);
    setEditSheetOpen(true);
  }

  function openEdit(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setEditingItem(item);
    setEditSheetOpen(true);
  }

  async function handleSave(patch: Partial<ScheduleItem> & { id?: string }) {
    if (patch.id) {
      // Update existing
      setItems(prev => prev.map(i => i.id === patch.id ? { ...i, ...patch } : i));
      await supabase.from("schedule_items").update({
        title: patch.title,
        time:  patch.time,
        type:  patch.type,
        notes: patch.notes,
      }).eq("id", patch.id);
    } else {
      // Create new
      const tempId = `temp_${Date.now()}`;
      const newItem: ScheduleItem = {
        id:     tempId,
        title:  patch.title ?? "",
        time:   patch.time  ?? "",
        type:   patch.type  ?? "play",
        notes:  patch.notes ?? "",
        done:   false,
        active: false,
      };
      setItems(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("schedule_items").insert({
        id:             tempId,
        title:          newItem.title,
        time:           newItem.time,
        type:           newItem.type,
        notes:          newItem.notes,
        done:           false,
        active:         false,
        child_id:       "default",
        scheduled_date: today,
      }).select("id").single();
      if (data && (data as Record<string, unknown>).id !== tempId) {
        const realId = String((data as Record<string, unknown>).id);
        setItems(prev => prev.map(i => i.id === tempId ? { ...i, id: realId } : i));
      }
    }
  }

  async function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("schedule_items").delete().eq("id", id);
  }

  const isPastDay     = selectedDate !== null;
  const displayItems  = isPastDay
    ? items.map(i => ({ ...i, done: true, active: false }))
    : items;

  const completed = displayItems.filter(i => i.done);
  const upcoming  = displayItems.filter(i => !i.done);
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

      <EditSheet
        open={editSheetOpen}
        item={editingItem}
        onClose={() => setEditSheetOpen(false)}
        onSave={handleSave}
      />

      {/* Header */}
      <div
        className="px-5 pt-9 pb-4 sticky top-0 z-10 backdrop-blur-2xl border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-start gap-2.5">
            <NavMenuButton className="mt-0.5 -ml-1.5 shrink-0" />
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
          className="p-4 pb-28 space-y-6"
        >
          {isPastDay ? (
            <section>
              <p className="text-[11px] font-semibold text-muted-foreground/50 tracking-wide px-1 mb-3">
                {selectedDate}
              </p>
              <div className="space-y-2">
                {displayItems.map(item => (
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
                    {upcoming.map(item => (
                      <ScheduleBlock
                        key={item.id}
                        item={item}
                        onToggle={handleToggleDone}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
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
                    {completed.map(item => (
                      <ScheduleBlock
                        key={item.id}
                        item={item}
                        onToggle={handleToggleDone}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {items.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[14px] text-muted-foreground/50 font-medium">
                    Nothing scheduled yet
                  </p>
                  <p className="text-[12px] text-muted-foreground/35 mt-1">
                    Tap + to add an activity
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* FAB — add activity */}
      {!isPastDay && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={openAdd}
          className="fixed bottom-24 right-5 z-20 w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "var(--foreground)",
            boxShadow:  "var(--shadow-float)",
          }}
          aria-label="Add activity"
        >
          <Plus size={22} strokeWidth={2} className="text-background" />
        </motion.button>
      )}
    </div>
  );
}
