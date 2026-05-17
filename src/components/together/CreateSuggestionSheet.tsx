"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { createSuggestion } from "@/lib/supabase/suggestions"
import type { SuggestionType } from "@/lib/data/demo"

const CATEGORIES: { type: SuggestionType; emoji: string; label: string }[] = [
  { type: "activity", emoji: "🎯", label: "Activity" },
  { type: "food",     emoji: "🥣", label: "Food"     },
  { type: "schedule", emoji: "🗓", label: "Schedule" },
]

interface Props {
  open: boolean
  onClose(): void
  onCreated(): void
}

export default function CreateSuggestionSheet({ open, onClose, onCreated }: Props) {
  const [category,    setCategory]    = useState<SuggestionType>("activity")
  const [title,       setTitle]       = useState("")
  const [description, setDescription] = useState("")
  const [reason,      setReason]      = useState("")
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  const canSave = title.trim().length > 0

  function handleClose() {
    if (saving) return
    setCategory("activity")
    setTitle("")
    setDescription("")
    setReason("")
    setSaved(false)
    onClose()
  }

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    await createSuggestion({
      type:        category,
      title:       title.trim(),
      description: description.trim(),
      reason:      reason.trim(),
      created_by:  "nanny",
      child_id:    "default",
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      handleClose()
      onCreated()
    }, 750)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            key="cs-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div
              className="rounded-t-[2rem] px-5 pt-3 pb-28"
              style={{ background: "var(--surface-card)" }}
            >
              <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-4" />

              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Share with Sofia
                </span>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Category tiles */}
              <div className="flex gap-2 mb-5">
                {CATEGORIES.map(({ type, emoji, label }) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setCategory(type)}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-150"
                    style={{
                      background: category === type ? "var(--accent-light)" : "var(--surface-page)",
                      border: `2px solid ${category === type ? "var(--accent-primary)" : "transparent"}`,
                    }}
                  >
                    <span className="text-[22px] leading-none">{emoji}</span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: category === type ? "var(--accent-primary)" : "var(--foreground)" }}
                    >
                      {label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Title */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What's the idea?"
                className="w-full text-[16px] font-semibold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:font-normal mb-4"
              />

              {/* Description */}
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell them what you have in mind…"
                rows={3}
                className="w-full resize-none text-[14px] text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/30 placeholder:italic mb-4"
              />

              {/* Reason */}
              <div className="mb-5">
                <p className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-widest mb-1.5">
                  Why is this good for Mateo?
                </p>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="The thinking behind it…"
                  rows={2}
                  className="w-full resize-none text-[14px] text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/30 placeholder:italic"
                />
              </div>

              <motion.button
                onClick={handleSave}
                disabled={!canSave || saving || saved}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-opacity duration-150"
                style={{
                  background: saved
                    ? "#5BC8A8"
                    : "linear-gradient(135deg, var(--accent-primary), var(--accent-soft))",
                  opacity: canSave || saved ? 1 : 0.3,
                }}
              >
                {saved ? (
                  <><Check className="w-4 h-4" strokeWidth={2.5} /> Shared!</>
                ) : (
                  "Share with Sofia"
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
