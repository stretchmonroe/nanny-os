"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { typeConfig } from "@/lib/data/demo";

type RoutineType = keyof typeof typeConfig;

const TYPE_OPTIONS: { value: RoutineType; emoji: string; label: string }[] = [
  { value: "meal",     emoji: "🍽️", label: "Meal"     },
  { value: "nap",      emoji: "😴", label: "Nap"      },
  { value: "outdoor",  emoji: "🌳", label: "Outdoor"  },
  { value: "play",     emoji: "🧸", label: "Play"     },
  { value: "learning", emoji: "📚", label: "Learning" },
  { value: "creative", emoji: "🎨", label: "Creative" },
];

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  open: boolean;
  childId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function LogRoutineSheet({ open, childId, onClose, onSaved }: Props) {
  const [title, setTitle]     = useState("");
  const [type, setType]       = useState<RoutineType>("meal");
  const [time, setTime]       = useState(nowTime);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const today = new Date().toISOString().split("T")[0];
    const { error: err } = await supabase.from("schedule_items").insert({
      child_id:       childId,
      scheduled_date: today,
      time,
      title:          title.trim(),
      type,
      done:           false,
      active:         false,
      notes:          "",
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setTitle("");
    setTime(nowTime());
    onSaved();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface-card rounded-t-[2rem] shadow-2xl px-5 pt-5 pb-10"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-border/50 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-foreground tracking-tight">Log routine block</h2>
              <button onClick={onClose} className="p-1.5 rounded-full bg-surface-raised active:opacity-60">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex flex-wrap gap-2 mb-5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold border transition-colors",
                    type === opt.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-surface-raised border-border/50 text-muted-foreground"
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What happened? e.g. Lunch, Morning nap…"
              className="w-full bg-surface-raised rounded-2xl px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/30 focus:border-foreground/20 mb-4"
            />

            {/* Time */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-surface-raised rounded-2xl px-4 py-3 text-[14px] text-foreground outline-none border border-border/30 focus:border-foreground/20"
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-500 mb-3">{error}</p>
            )}

            <button
              onClick={save}
              disabled={!title.trim() || saving}
              className="w-full bg-foreground text-background text-[14px] font-bold py-4 rounded-2xl disabled:opacity-35 transition-opacity active:scale-[0.98] transition-transform"
            >
              {saving ? "Saving…" : "Save block"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
