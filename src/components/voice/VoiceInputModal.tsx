"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, Square, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { VoiceState } from "@/hooks/useVoiceInput"
import type { VoiceContext } from "@/lib/voice/transcriptParser"

const LABELS: Record<VoiceContext, string> = {
  grocery:  "Adding to grocery list",
  memory:   "Capturing a moment",
  schedule: "Logging activity",
}

const HINTS: Record<VoiceContext, string> = {
  grocery:  "\"Add blueberries, wipes, and yogurt…\"",
  memory:   "\"Mateo said a new word at the park…\"",
  schedule: "\"Nap started at 11:42…\"",
}

interface Props {
  state: VoiceState
  transcript: string
  interim: string
  context: VoiceContext
  onStop(): void
  onSave(text: string): void
  onCancel(): void
}

export default function VoiceInputModal({ state, transcript, interim, context, onStop, onSave, onCancel }: Props) {
  const [editText, setEditText] = useState("")
  const [saved, setSaved] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const visible   = state !== "idle" && state !== "unsupported"
  const listening = state === "listening"
  const done      = state === "done" || state === "error"

  useEffect(() => {
    if (done && transcript) {
      setEditText(transcript)
      setTimeout(() => areaRef.current?.focus(), 250)
    }
  }, [done, transcript])

  useEffect(() => {
    if (!visible) { setEditText(""); setSaved(false) }
  }, [visible])

  function handleSave() {
    if (!editText.trim()) return
    onSave(editText.trim())
    setSaved(true)
    navigator.vibrate?.([30, 10, 30])
    setTimeout(onCancel, 900)
  }

  const liveText = [transcript, interim].filter(Boolean).join(" ")

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="vbdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={onCancel}
          />

          <motion.div
            key="vmodal"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div
              className="rounded-t-[2rem] px-5 pt-3.5 pb-10 shadow-deep"
              style={{ background: "var(--surface-card)" }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">
                  {saved ? "Saved ✓" : LABELS[context]}
                </span>
                <button
                  onClick={onCancel}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Waveform + done button */}
              {listening && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-end gap-[3px] h-6">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-amber-400"
                        animate={{ height: ["5px", "20px", "5px"] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.13, ease: "easeInOut" }}
                        style={{ height: "5px" }}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-muted-foreground font-medium">Listening…</span>
                  <button
                    onClick={onStop}
                    className="ml-auto flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-[12px] font-semibold text-foreground active:scale-95 transition-transform"
                  >
                    <Square className="w-3 h-3 fill-current" strokeWidth={0} />
                    Done
                  </button>
                </div>
              )}

              {/* Live transcript / editable text */}
              <div className="min-h-[76px] mb-5">
                {listening ? (
                  <p className="text-[15px] font-medium text-foreground leading-relaxed">
                    {liveText || (
                      <span className="text-muted-foreground/40 italic text-[13px] font-normal">
                        {HINTS[context]}
                      </span>
                    )}
                    <motion.span
                      className="inline-block w-[2px] h-4 bg-amber-400 ml-0.5 align-middle rounded-full"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                    />
                  </p>
                ) : (
                  <textarea
                    ref={areaRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    placeholder={HINTS[context]}
                    className="w-full resize-none text-[15px] font-medium text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic placeholder:font-normal"
                  />
                )}
              </div>

              {/* Save / Discard */}
              {done && !saved && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-2xl bg-muted text-[14px] font-semibold text-muted-foreground active:scale-[0.97] transition-transform"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!editText.trim()}
                    className="flex-1 py-3.5 rounded-2xl bg-amber-400 text-[14px] font-bold text-amber-950 disabled:opacity-30 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    Save
                  </button>
                </motion.div>
              )}

              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30"
                >
                  <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                    Saved ✓
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
