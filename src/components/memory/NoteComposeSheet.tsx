"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { notifyHousehold } from "@/lib/push/notify";

const CATEGORIES = [
  { id: "play",     label: "Play",     emoji: "🎮" },
  { id: "meal",     label: "Meal",     emoji: "🍽️" },
  { id: "nap",      label: "Nap",      emoji: "😴" },
  { id: "outdoor",  label: "Outdoor",  emoji: "🌿" },
  { id: "learning", label: "Learning", emoji: "📚" },
  { id: "milestone",label: "Milestone",emoji: "✨" },
] as const;

type Category = typeof CATEGORIES[number]["id"];

interface Props {
  open:      boolean;
  childId:   string | null;
  childName?: string | null;
  onClose:   () => void;
  onSaved:   () => void;
  // Edit mode — pass these to pre-fill and UPDATE instead of INSERT
  momentId?:       string;
  initialText?:    string;
  initialCategory?: Category;
}

export default function NoteComposeSheet({ open, childId, childName, onClose, onSaved, momentId, initialText, initialCategory }: Props) {
  const [text,     setText]     = useState(initialText ?? "");
  const [category, setCategory] = useState<Category>(initialCategory ?? "play");
  const [saving,   setSaving]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { currentUserRole, profileFullName } = useAppStore();
  const isEdit = !!momentId;

  useEffect(() => {
    if (open) {
      setText(initialText ?? "");
      setCategory(initialCategory ?? "play");
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [open, initialText, initialCategory]);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);

    const type = category === "milestone" ? "milestone" : "note";
    const payload = {
      type,
      content:  text.trim(),
      category: category === "milestone" ? "play" : category,
    };

    if (isEdit) {
      await supabase.from("memory_events").update(payload).eq("id", momentId);
    } else {
      await supabase.from("memory_events").insert({
        ...payload,
        child_id:   childId ?? "default",
        created_by: currentUserRole ?? "nanny",
        created_at: new Date().toISOString(),
      });
      if (childId && childId !== "default") {
        notifyHousehold({
          childId,
          childName,
          senderRole: currentUserRole ?? "nanny",
          senderName: profileFullName,
          eventType:  category === "milestone" ? "milestone" : "note",
        });
      }
    }

    setSaving(false);
    onClose();
    onSaved();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-w-md mx-auto bg-surface-card rounded-t-[2rem] px-5 pt-5 pb-10 shadow-elevated"
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <p className="text-[17px] font-bold text-foreground">
                {isEdit ? "Edit moment" : "Add a moment"}
              </p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap mb-4">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-[0.96]",
                    category === c.id
                      ? "bg-foreground text-background"
                      : "bg-surface-raised text-muted-foreground"
                  )}
                >
                  <span>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening right now?"
              rows={4}
              className="w-full bg-surface-raised rounded-2xl px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
            />

            <button
              onClick={save}
              disabled={!text.trim() || saving}
              className="mt-3 w-full bg-foreground text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-30 active:scale-[0.98] transition-all"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save moment"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
