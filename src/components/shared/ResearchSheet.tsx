"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, Loader2, X } from "lucide-react"
import GuidanceTag from "@/components/ui/GuidanceTag"
import { callAI, parseAIJson } from "@/lib/ai/client"
import { isValidGuidanceSource } from "@/lib/ai/guidance"
import type { GuidanceSource } from "@/lib/ai/guidance"
import { useAppStore } from "@/store/useAppStore"

const SUGGESTIONS = [
  "When do toddlers start sharing?",
  "Is honey safe at 18 months?",
  "What is parallel play?",
  "How much sleep does a toddler need?",
]

type ResearchResult = {
  answer: string
  guidanceSource: GuidanceSource
  ageContext: string
  relatedTopics: string[]
}

interface Props {
  open: boolean
  onClose(): void
  initialQuestion?: string
}

export default function ResearchSheet({ open, onClose, initialQuestion }: Props) {
  const { activeChild } = useAppStore()
  const [question, setQuestion]     = useState(initialQuestion ?? "")
  const [loading,  setLoading]      = useState(false)
  const [result,   setResult]       = useState<ResearchResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuestion(initialQuestion ?? "")
      setResult(null)
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [open, initialQuestion])

  async function handleAsk(q?: string) {
    const text = (q ?? question).trim()
    if (!text || loading) return
    setQuestion(text)
    setLoading(true)
    setResult(null)
    const res = await callAI("research", {
      question: text,
      childAge: activeChild.age,
      childName: activeChild.name,
    })
    setLoading(false)
    if (!res) return
    const parsed = parseAIJson<ResearchResult>(res.result, {
      answer: "We couldn't find an answer right now. Try rephrasing your question.",
      guidanceSource: "General developmental practice",
      ageContext: "at 18 months",
      relatedTopics: [],
    })
    if (!isValidGuidanceSource(parsed.guidanceSource)) {
      parsed.guidanceSource = "General developmental practice"
    }
    setResult(parsed)
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setQuestion("")
      setResult(null)
      setLoading(false)
    }, 350)
  }

  const canAsk = question.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="rs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          <motion.div
            key="rs-sheet"
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

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Research
                  </span>
                  <p className="text-[12px] text-muted-foreground/50 font-medium mt-0.5">
                    Evidence-informed, not medical advice
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Question input */}
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4"
                style={{ background: "var(--surface-page)", border: "2px solid var(--border-soft)" }}
              >
                <input
                  ref={inputRef}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && canAsk) handleAsk() }}
                  placeholder="Ask about milestones, foods, activities…"
                  className="flex-1 text-[14px] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic font-medium"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAsk()}
                  disabled={!canAsk || loading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
                  style={{
                    background: canAsk && !loading ? "var(--accent-primary)" : "var(--border-medium)",
                  }}
                >
                  {loading ? (
                    <Loader2 size={14} className="text-white animate-spin" />
                  ) : (
                    <ArrowUp size={14} className="text-white" strokeWidth={2.5} />
                  )}
                </motion.button>
              </div>

              {/* Suggestion chips — only when no result */}
              <AnimatePresence mode="wait">
                {!result && !loading && (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2.5">
                      Try asking
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map(s => (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => { setQuestion(s); handleAsk(s) }}
                          className="px-3 py-1.5 rounded-full text-[12px] font-medium select-none"
                          style={{
                            background: "var(--surface-page)",
                            color:      "var(--foreground)",
                            border:     "1.5px solid var(--border-medium)",
                          }}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Loading state */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-6 text-center"
                  >
                    <p className="text-[13px] text-muted-foreground/45 italic">
                      Looking into that…
                    </p>
                  </motion.div>
                )}

                {/* Result */}
                {result && !loading && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                  >
                    {/* Age context */}
                    {result.ageContext && (
                      <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">
                        {result.ageContext}
                      </p>
                    )}

                    {/* Answer */}
                    <p className="text-[15px] text-foreground/80 leading-relaxed mb-4">
                      {result.answer}
                    </p>

                    {/* Source */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-medium text-muted-foreground/40">
                        Informed by
                      </span>
                      <GuidanceTag source={result.guidanceSource} size="xs" />
                    </div>

                    {/* Related topics */}
                    {result.relatedTopics.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2.5">
                          Related questions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.relatedTopics.map(t => (
                            <motion.button
                              key={t}
                              whileTap={{ scale: 0.93 }}
                              onClick={() => { setQuestion(t); handleAsk(t) }}
                              className="px-3 py-1.5 rounded-full text-[12px] font-medium select-none"
                              style={{
                                background: "var(--accent-light)",
                                color:      "var(--accent-primary)",
                                border:     "1.5px solid transparent",
                              }}
                            >
                              {t}
                            </motion.button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
