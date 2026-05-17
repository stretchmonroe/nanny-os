"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Check, X } from "lucide-react"

const GROCERY_CHIPS = [
  "Bananas", "Blueberries", "Avocado", "Whole milk",
  "Yogurt pouches", "Eggs", "Rice cakes", "Cheese sticks",
  "Apple sauce", "Sweet potato", "Crackers", "Baby spinach",
]

const NOTE_EMOJIS = ["😄", "🌿", "⭐", "🎯", "🍼", "💛"]

interface Props {
  mode: "note" | "grocery"
  open: boolean
  onSave(text: string): void
  onInstantAdd?(name: string): void
  onClose(): void
}

export default function QuickCaptureSheet({ mode, open, onSave, onInstantAdd, onClose }: Props) {
  const [text, setText] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("")
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText("")
      setSelectedEmoji("")
      setSaved(false)
      setTimeout(() => {
        textareaRef.current?.focus()
        inputRef.current?.focus()
      }, 320)
    }
  }, [open])

  function handleSave() {
    const value = text.trim()
    if (!value) return
    onSave(selectedEmoji ? `${selectedEmoji} ${value}` : value)
    setSaved(true)
    navigator.vibrate?.(40)
    setTimeout(() => {
      setSaved(false)
      setText("")
      setSelectedEmoji("")
      onClose()
    }, 750)
  }

  function handleChipTap(chip: string) {
    onInstantAdd?.(chip)
    navigator.vibrate?.(30)
  }

  const canSave = text.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="qcs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="qcs-sheet"
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
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {mode === "note" ? "Quick Note" : "Add to Groceries"}
                </span>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {mode === "note" ? (
                <>
                  {/* Mood emoji row */}
                  <div className="flex gap-2 mb-4">
                    {NOTE_EMOJIS.map(e => (
                      <motion.button
                        key={e}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => setSelectedEmoji(e === selectedEmoji ? "" : e)}
                        className="w-10 h-10 rounded-2xl text-[20px] flex items-center justify-center transition-all duration-150"
                        style={{
                          background:   e === selectedEmoji ? "var(--accent-light)" : "var(--surface-page)",
                          border:       `2px solid ${e === selectedEmoji ? "var(--accent-primary)" : "transparent"}`,
                          boxShadow:    e === selectedEmoji ? "0 0 0 3px rgba(255,123,84,0.12)" : "none",
                        }}
                      >
                        {e}
                      </motion.button>
                    ))}
                  </div>

                  {/* Text area */}
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="What's happening right now…"
                    rows={4}
                    className="w-full resize-none text-[15px] text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:font-normal placeholder:italic font-medium mb-4"
                  />
                </>
              ) : (
                <>
                  {/* Grocery text input */}
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5"
                    style={{ background: "var(--surface-page)", border: "2px solid var(--border-soft)" }}
                  >
                    <input
                      ref={inputRef}
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave() }}
                      placeholder="Type an item…"
                      className="flex-1 text-[15px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic font-medium"
                    />
                  </div>

                  {/* Suggestion chips */}
                  <p className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-widest mb-2.5">
                    Quick add
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {GROCERY_CHIPS.map(chip => (
                      <motion.button
                        key={chip}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleChipTap(chip)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-semibold select-none active:opacity-60 transition-opacity"
                        style={{
                          background: "var(--surface-page)",
                          color:      "var(--foreground)",
                          border:     "1.5px solid var(--border-medium)",
                        }}
                      >
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* Save button */}
              <motion.button
                onClick={handleSave}
                disabled={!canSave || saved}
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
                  <><Check className="w-4 h-4" strokeWidth={2.5} /> Saved!</>
                ) : mode === "note" ? (
                  "Save Note"
                ) : (
                  "Add Item"
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
