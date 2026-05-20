"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronLeft, Plus, X, Check, RefreshCw } from "lucide-react";
import { NavMenuButton } from "@/components/layout/NavMenuButton";
import { typeConfig, demoPatterns } from "@/lib/data/demo";
import { useAppStore } from "@/store/useAppStore";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";
import DatePicker from "@/components/memory/DatePicker";
import { PatternCard } from "@/components/insights/PatternCard";
import { cn } from "@/lib/utils";
import {
  fetchSchedule,
  createScheduleItem,
  updateScheduleItem,
  markItemStatus,
  deleteScheduleItem,
  labelToISODate,
  type ScheduleItem,
  type ActivityType,
  type ItemStatus,
} from "@/lib/supabase/schedule";

const TYPE_OPTIONS = Object.keys(typeConfig) as ActivityType[];

const todayStr = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month:   "long",
  day:     "numeric",
});

// ── Edit / Add Sheet ──────────────────────────────────────────────────────────

interface EditSheetProps {
  open:      boolean;
  item?:     ScheduleItem | null;
  onClose(): void;
  onSave(patch: {
    id?:                   string;
    title:                 string;
    time:                  string;
    type:                  ActivityType;
    notes:                 string;
    description:           string;
    flexible_window_label: string;
  }): void;
}

function EditSheet({ open, item, onClose, onSave }: EditSheetProps) {
  const isNew = !item;
  const [title,  setTitle]  = useState(item?.title  ?? "");
  const [time,   setTime]   = useState(item?.time   ?? "");
  const [type,   setType]   = useState<ActivityType>(item?.type  ?? "play");
  const [notes,  setNotes]  = useState(item?.notes  ?? "");
  const [desc,   setDesc]   = useState(item?.description           ?? "");
  const [window, setWindow] = useState(item?.flexible_window_label ?? "");

  useEffect(() => {
    if (open) {
      setTitle(item?.title  ?? "");
      setTime(item?.time    ?? "");
      setType(item?.type    ?? "play");
      setNotes(item?.notes  ?? "");
      setDesc(item?.description           ?? "");
      setWindow(item?.flexible_window_label ?? "");
    }
  }, [open, item]);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id:                   item?.id,
      title:                title.trim(),
      time:                 time.trim(),
      type,
      notes:                notes.trim(),
      description:          desc.trim(),
      flexible_window_label: window.trim(),
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
            <div className="w-9 h-1 rounded-full mx-auto mb-5 opacity-20"
              style={{ background: "var(--text-primary)" }} />

            <div className="flex items-center justify-between mb-5">
              <p className="text-[17px] font-bold text-foreground">
                {isNew ? "Add activity" : "Edit activity"}
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
                  Activity
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

              {/* When — flexible label */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5 block">
                  When <span className="font-normal normal-case">(optional)</span>
                </label>
                <input
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  placeholder="e.g. 10:30 AM, After nap, Morning"
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
                  placeholder="Snack ideas, materials needed, anything helpful…"
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground outline-none resize-none"
                  style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!title.trim()}
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

// ── Replace Sheet ─────────────────────────────────────────────────────────────

interface ReplaceSheetProps {
  open:      boolean;
  itemTitle: string;
  onClose(): void;
  onConfirm(replacementNote: string): void;
}

function ReplaceSheet({ open, itemTitle, onClose, onConfirm }: ReplaceSheetProps) {
  const [value, setValue] = useState("");

  useEffect(() => { if (open) setValue(""); }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="replace-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.div
            key="replace-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto rounded-t-[2rem] px-5 pt-4 pb-10"
            style={{ background: "var(--surface-card)" }}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-5 opacity-20"
              style={{ background: "var(--text-primary)" }} />

            <div className="flex items-center justify-between mb-2">
              <p className="text-[17px] font-bold text-foreground">What did you do instead?</p>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.07)" }}>
                <X size={12} strokeWidth={2.2} className="text-foreground/40" />
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground/55 mb-5">
              Replacing <span className="font-semibold text-foreground/70">{itemTitle}</span>
            </p>

            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && value.trim()) { onConfirm(value.trim()); onClose(); } }}
              placeholder="e.g. Indoor sensory play, Backyard water table…"
              className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground outline-none mb-4"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
              autoFocus
            />

            <button
              onClick={() => { if (value.trim()) { onConfirm(value.trim()); onClose(); } }}
              disabled={!value.trim()}
              className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold disabled:opacity-40 transition-all active:scale-[0.98]"
              style={{ background: "var(--foreground)", color: "var(--background)" }}
            >
              <RefreshCw size={14} strokeWidth={2} />
              Mark replaced
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { activeChildId, activeChild, memberNames, currentUserRole } = useAppStore();

  const [items,         setItems]         = useState<ScheduleItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [pickerOpen,    setPickerOpen]    = useState(false);
  const [selectedDate,  setSelectedDate]  = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingItem,   setEditingItem]   = useState<ScheduleItem | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<ScheduleItem | null>(null);

  const itemsRef = useRef<ScheduleItem[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // ── Load ─────────────────────────────────────────────────────────────────────

  async function load(dateLabel: string | null) {
    setLoading(true);
    const isoDate = labelToISODate(dateLabel);
    const data = await fetchSchedule(isoDate);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load(selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChildId, selectedDate]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isPastDay    = selectedDate !== null;
  const headerDate   = isPastDay ? selectedDate! : todayStr;
  const upcoming     = items.filter(i => i.status === "planned");
  const done         = items.filter(i => i.status !== "planned");

  // ── Mutations ─────────────────────────────────────────────────────────────────

  async function handleToggleDone(id: string) {
    if (isPastDay) return;
    const item = itemsRef.current.find(i => i.id === id);
    if (!item || item.status !== "planned") return;
    const authorType = (currentUserRole ?? "nanny") as "nanny" | "parent";
    // Optimistic
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: "completed" as ItemStatus, done: true, completed_by: authorType } : i
    ));
    const { error } = await (async () => {
      try {
        await markItemStatus(id, "completed", authorType);
        return { error: null };
      } catch (e) {
        return { error: e };
      }
    })();
    if (error) {
      // Rollback
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
    }
  }

  async function handleSkip(id: string) {
    if (isPastDay) return;
    const item = itemsRef.current.find(i => i.id === id);
    if (!item) return;
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: "skipped" as ItemStatus, done: false } : i
    ));
    try {
      await markItemStatus(id, "skipped");
    } catch {
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
    }
  }

  function openReplace(id: string) {
    const item = itemsRef.current.find(i => i.id === id);
    if (!item) return;
    setReplaceTarget(item);
  }

  async function handleReplace(replacementNote: string) {
    if (!replaceTarget) return;
    const id   = replaceTarget.id;
    const prev = replaceTarget;
    const newNotes = replacementNote
      ? `Replaced with: ${replacementNote}`
      : prev.notes;
    setItems(curr => curr.map(i =>
      i.id === id ? { ...i, status: "replaced" as ItemStatus, done: false, notes: newNotes } : i
    ));
    try {
      await markItemStatus(id, "replaced");
      await updateScheduleItem(id, { notes: newNotes });
    } catch {
      setItems(curr => curr.map(i => i.id === id ? { ...i, ...prev } : i));
    }
    setReplaceTarget(null);
  }

  async function handleSave(patch: {
    id?:                   string;
    title:                 string;
    time:                  string;
    type:                  ActivityType;
    notes:                 string;
    description:           string;
    flexible_window_label: string;
  }) {
    if (patch.id) {
      // Update existing
      const prev = itemsRef.current.find(i => i.id === patch.id);
      setItems(curr => curr.map(i => i.id === patch.id ? { ...i, ...patch } : i));
      try {
        await updateScheduleItem(patch.id, {
          title:                 patch.title,
          time:                  patch.time,
          type:                  patch.type,
          notes:                 patch.notes,
          description:           patch.description,
          flexible_window_label: patch.flexible_window_label,
        });
      } catch {
        if (prev) setItems(curr => curr.map(i => i.id === patch.id ? prev : i));
      }
    } else {
      // Create new — temp placeholder first
      const tempId = `temp_${Date.now()}`;
      const isoDate = labelToISODate(selectedDate);
      const authorType = (currentUserRole ?? "nanny") as "nanny" | "parent";
      const optimistic: ScheduleItem = {
        id:                    tempId,
        child_id:              activeChildId,
        scheduled_date:        isoDate,
        title:                 patch.title,
        time:                  patch.time,
        type:                  patch.type,
        status:                "planned",
        notes:                 patch.notes,
        description:           patch.description,
        flexible_window_label: patch.flexible_window_label,
        created_by:            authorType,
        completed_by:          null,
        created_at:            new Date().toISOString(),
        done:                  false,
        active:                false,
      };
      setItems(prev => [...prev, optimistic].sort((a, b) => a.time.localeCompare(b.time)));
      const saved = await createScheduleItem({
        title:                 patch.title,
        time:                  patch.time,
        type:                  patch.type,
        notes:                 patch.notes,
        description:           patch.description,
        flexible_window_label: patch.flexible_window_label,
        scheduled_date:        isoDate,
      });
      if (saved) {
        setItems(prev => prev.map(i => i.id === tempId ? saved : i));
      } else {
        setItems(prev => prev.filter(i => i.id !== tempId));
      }
    }
  }

  async function handleDelete(id: string) {
    const snapshot = itemsRef.current.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      await deleteScheduleItem(id);
    } catch {
      if (snapshot) setItems(prev => [...prev, snapshot].sort((a, b) => a.time.localeCompare(b.time)));
    }
  }

  function openAdd()  { setEditingItem(null);                                       setEditSheetOpen(true); }
  function openEdit(id: string) { setEditingItem(itemsRef.current.find(i => i.id === id) ?? null); setEditSheetOpen(true); }

  const caregiverLabel = memberNames.nanny !== "Caregiver" ? `with ${memberNames.nanny}` : "";

  return (
    <div className="min-h-screen bg-surface-page">
      <DatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectDay={date => setSelectedDate(date === "Today" ? null : date)}
        dayOnly
        title="Schedule"
      />

      <EditSheet
        open={editSheetOpen}
        item={editingItem}
        onClose={() => setEditSheetOpen(false)}
        onSave={handleSave}
      />

      <ReplaceSheet
        open={!!replaceTarget}
        itemTitle={replaceTarget?.title ?? ""}
        onClose={() => setReplaceTarget(null)}
        onConfirm={handleReplace}
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
            {activeChild.name}&apos;s day{caregiverLabel ? ` · ${caregiverLabel}` : ""}
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
          {loading ? (
            <div className="space-y-2 pt-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-16 rounded-2xl animate-pulse"
                  style={{ background: "var(--surface-card)", opacity: 1 - i * 0.25 }}
                />
              ))}
            </div>
          ) : isPastDay ? (
            /* Past day — all items shown read-only */
            <section>
              <p className="text-[11px] font-semibold text-muted-foreground/50 tracking-wide px-1 mb-3">
                {selectedDate}
              </p>
              {items.length === 0 ? (
                <p className="text-center text-[13px] text-muted-foreground/40 py-10">
                  No activities recorded for this day
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <ScheduleBlock key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              {/* Upcoming */}
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
                        onSkip={handleSkip}
                        onReplace={openReplace}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Done / skipped / replaced */}
              {done.length > 0 && (
                <section>
                  <p className="text-[11px] font-semibold text-muted-foreground/45 tracking-wide px-1 mb-3">
                    Earlier today
                  </p>
                  <div className="space-y-2">
                    {done.map(item => (
                      <ScheduleBlock
                        key={item.id}
                        item={item}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {!loading && items.length === 0 && (
                <div className="text-center py-14">
                  <p className="text-[36px] mb-3">🌤</p>
                  <p className="text-[14px] text-muted-foreground/50 font-semibold mb-1">
                    Nothing planned yet
                  </p>
                  <p className="text-[12px] text-muted-foreground/35">
                    Tap + to add an activity for today
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* FAB — add activity (today only) */}
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
