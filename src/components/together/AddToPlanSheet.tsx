"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Check } from "lucide-react"
import type { Suggestion } from "@/lib/data/demo"

// ── Day options ────────────────────────────────────────────────────────────────

function getUpcomingDays(): { label: string; sub: string }[] {
  const days = []
  const today = new Date()
  const NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

  days.push({ label: "Today",    sub: NAMES[today.getDay()] })
  days.push({ label: "Tomorrow", sub: NAMES[(today.getDay() + 1) % 7] })

  // Next 3 weekdays after tomorrow
  let added = 0
  let d = 2
  while (added < 3) {
    const name = NAMES[(today.getDay() + d) % 7]
    if (name !== "Saturday" && name !== "Sunday") {
      days.push({ label: name, sub: "" })
      added++
    }
    d++
  }

  return days
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  suggestion:   Suggestion
  open:         boolean
  onClose():    void
  onScheduled(day: string): void
}

export default function AddToPlanSheet({ suggestion, open, onClose, onScheduled }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  const days = getUpcomingDays()

  function handleConfirm() {
    if (!selected || done) return
    setDone(true)
    setTimeout(() => {
      onScheduled(selected)
      onClose()
      // reset for next open
      setTimeout(() => { setSelected(null); setDone(false) }, 400)
    }, 800)
  }

  function handleClose() {
    if (done) return
    setSelected(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="atp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            key="atp-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
          >
            <div
              className="rounded-t-[2rem] px-5 pt-3 pb-10"
              style={{ background: "var(--surface-card)" }}
            >
              {/* Handle + close */}
              <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-4" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    Add to plan
                  </p>
                  <p className="text-[17px] font-bold text-foreground leading-snug mt-0.5 max-w-[260px]">
                    {suggestion.title}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform shrink-0 mt-1"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Day grid */}
              <p className="text-[12px] font-semibold text-muted-foreground/50 mb-3">
                When should Elena try this?
              </p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {days.map(({ label, sub }) => {
                  const active = selected === label
                  return (
                    <motion.button
                      key={label}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSelected(label)}
                      className="flex flex-col items-center py-3.5 px-2 rounded-2xl transition-all duration-150"
                      style={{
                        background: active ? "rgba(42,105,101,0.08)" : "var(--surface-raised)",
                        border:     `1.5px solid ${active ? "#2A6965" : "transparent"}`,
                      }}
                    >
                      <span
                        className="text-[14px] font-bold leading-none"
                        style={{ color: active ? "#2A6965" : "var(--foreground)" }}
                      >
                        {label}
                      </span>
                      {sub && (
                        <span className="text-[10px] text-muted-foreground/45 font-medium mt-1">
                          {sub}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Confirm */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={!selected || done}
                onClick={handleConfirm}
                className="w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-150"
                style={{
                  background: done
                    ? "var(--sage-light)"
                    : selected
                    ? "linear-gradient(135deg, #2A6965, #3D8480)"
                    : "var(--surface-raised)",
                  color: done
                    ? "var(--sage)"
                    : selected
                    ? "white"
                    : "var(--muted-foreground)",
                  opacity: selected || done ? 1 : 0.5,
                }}
              >
                {done ? (
                  <><Check className="w-4 h-4" strokeWidth={2.5} /> Added to {selected}&apos;s plan</>
                ) : (
                  selected ? `Add to ${selected}'s plan →` : "Pick a day first"
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
