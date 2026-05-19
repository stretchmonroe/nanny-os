"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import AuthorBadge from "@/components/ui/AuthorBadge"
import ReplyThread from "@/components/memory/ReplyThread"
import AddToPlanSheet from "@/components/together/AddToPlanSheet"
import { fetchReplies, updateSuggestionStatus, updateSuggestionWorkflow } from "@/lib/supabase/suggestions"
import type { Suggestion, SuggestionReply, SuggestionStatus } from "@/lib/data/demo"

const CATEGORY_CONFIG = {
  activity: { emoji: "🎯", label: "Activity", accent: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  food:     { emoji: "🥣", label: "Food",     accent: "#10B981", bg: "rgba(16,185,129,0.08)" },
  schedule: { emoji: "🗓", label: "Schedule", accent: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function toMomentReply(r: SuggestionReply) {
  return {
    id:      r.id,
    author:  r.author,
    content: r.content,
    time:    new Date(r.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
}

interface Props {
  suggestion: Suggestion | null
  open: boolean
  onClose(): void
  onStatusChange(id: string, status: SuggestionStatus): void
  onWorkflowUpdate?(id: string, patch: Partial<Suggestion>): void
}

export default function SuggestionDetailSheet({ suggestion, open, onClose, onStatusChange, onWorkflowUpdate }: Props) {
  const [expanded,  setExpanded]  = useState(false)
  const [replies,   setReplies]   = useState<SuggestionReply[]>([])
  const [planOpen,  setPlanOpen]  = useState(false)
  const [noting,    setNoting]    = useState(false)
  const [noteText,  setNoteText]  = useState("")
  const [skipped,   setSkipped]   = useState(false)
  const replyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && suggestion) {
      setExpanded(false)
      setNoting(false)
      setNoteText("")
      setSkipped(false)
      fetchReplies(suggestion.id).then(setReplies)
    }
  }, [open, suggestion?.id])

  function handleApprove() {
    if (!suggestion) return
    onStatusChange(suggestion.id, "approved")
    updateSuggestionStatus(suggestion.id, "approved")
  }

  function handleReject() {
    if (!suggestion) return
    onStatusChange(suggestion.id, "rejected")
    updateSuggestionStatus(suggestion.id, "rejected")
  }

  function handleDiscuss() {
    replyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  function handleScheduled(day: string) {
    if (!suggestion) return
    onWorkflowUpdate?.(suggestion.id, { scheduledDay: day })
    updateSuggestionWorkflow(suggestion.id, { scheduledDay: day })
  }

  function handleOutcome(rating: "great" | "noted", note?: string) {
    if (!suggestion) return
    onWorkflowUpdate?.(suggestion.id, { outcomeRating: rating, outcomeNote: note })
    updateSuggestionWorkflow(suggestion.id, { outcomeRating: rating, outcomeNote: note })
  }

  if (!suggestion) return null
  const cat = CATEGORY_CONFIG[suggestion.type]

  return (
    <>
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sd-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="sd-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            style={{ maxHeight: "90vh" }}
          >
            <div
              className="rounded-t-[2rem] overflow-y-auto"
              style={{ background: "var(--surface-card)", maxHeight: "90vh" }}
            >
              {/* Handle + close */}
              <div className="sticky top-0 z-10 px-5 pt-3 pb-3" style={{ background: "var(--surface-card)" }}>
                <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: cat.bg, color: cat.accent }}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                    {suggestion.status === "approved" && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sage-light text-sage dark:text-sage-muted">
                        ✓ Approved
                      </span>
                    )}
                    {suggestion.status === "rejected" && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-muted-foreground" style={{ background: "var(--surface-page)" }}>
                        Not this time
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-10">
                {/* Author */}
                <AuthorBadge
                  author={suggestion.created_by}
                  time={formatDate(suggestion.created_at)}
                  showRole={false}
                  className="mb-3"
                />

                {/* Title */}
                <h2 className="text-[22px] font-bold text-foreground leading-tight tracking-tight mb-3">
                  {suggestion.title}
                </h2>

                {/* Description */}
                <p className="text-[15px] text-foreground/75 leading-relaxed mb-4">
                  {suggestion.description}
                </p>

                {/* Why this matters — collapsible */}
                {suggestion.reason && (
                  <div className="mb-5">
                    <button
                      onClick={() => setExpanded(v => !v)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold mb-2"
                      style={{ color: cat.accent }}
                    >
                      Why this matters
                      <ChevronDown
                        size={13}
                        className={cn("transition-transform duration-200", expanded && "rotate-180")}
                      />
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="text-[14px] text-muted-foreground leading-relaxed">
                            {suggestion.reason}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="border-t border-soft my-5" />

                {/* Approval section */}
                {suggestion.status === "pending" && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-widest mb-3">
                      Sofia's call
                    </p>
                    <div className="space-y-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleApprove}
                        className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-left px-4 transition-all duration-150"
                        style={{ background: "var(--sage-light)", color: "var(--sage)" }}
                      >
                        Sounds great 👍
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDiscuss}
                        className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-left px-4 transition-all duration-150"
                        style={{ background: "var(--surface-page)", color: "var(--foreground)" }}
                      >
                        Let's talk about it 💬
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleReject}
                        className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-left px-4 text-muted-foreground transition-all duration-150"
                        style={{ background: "var(--surface-page)" }}
                      >
                        Not right now
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Response display (if already decided) */}
                {suggestion.status !== "pending" && (
                  <div className="mb-6">
                    {suggestion.status === "approved" && (
                      <div className="rounded-2xl px-4 py-3.5 bg-sage-light dark:bg-sage-light/10">
                        <p className="text-[12px] font-semibold text-sage dark:text-sage-muted mb-0.5">
                          Sofia approved this
                        </p>
                        {suggestion.response_note && (
                          <p className="text-[13px] text-foreground/70 italic leading-relaxed">
                            "{suggestion.response_note}"
                          </p>
                        )}
                      </div>
                    )}
                    {suggestion.status === "rejected" && (
                      <div className="rounded-2xl px-4 py-3.5" style={{ background: "var(--surface-page)" }}>
                        <p className="text-[12px] font-semibold text-muted-foreground">
                          Passed on for now
                        </p>
                        {suggestion.response_note && (
                          <p className="text-[13px] text-muted-foreground italic leading-relaxed mt-0.5">
                            "{suggestion.response_note}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow trail — scheduling + outcome capture */}
                {suggestion.status === "approved" && (
                  <div className="mb-6">
                    {/* Not yet scheduled */}
                    {!suggestion.scheduledDay && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPlanOpen(true)}
                        className="w-full py-3.5 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
                        style={{ background: "linear-gradient(135deg, #2A6965, #3D8480)", color: "white" }}
                      >
                        Try it this week →
                      </motion.button>
                    )}

                    {/* Scheduled, outcome not yet captured */}
                    {suggestion.scheduledDay && !suggestion.outcomeRating && !skipped && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 px-0.5">
                          <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                            Scheduled for
                          </span>
                          <span className="text-[13px] font-bold" style={{ color: "#2A6965" }}>
                            {suggestion.scheduledDay}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider mb-2.5 px-0.5">
                          How did it go?
                        </p>
                        <div className="space-y-2">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleOutcome("great")}
                            className="w-full py-3 rounded-2xl text-[14px] font-semibold text-left px-4 transition-all"
                            style={{ background: "rgba(90,158,128,0.10)", color: "#2A6965" }}
                          >
                            ✨ Went well
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setNoting(v => !v)}
                            className="w-full py-3 rounded-2xl text-[14px] font-semibold text-left px-4 transition-all"
                            style={{ background: "var(--surface-page)", color: "var(--foreground)" }}
                          >
                            📝 Worth noting
                          </motion.button>
                          <AnimatePresence>
                            {noting && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                                className="overflow-hidden"
                              >
                                <div className="pt-1 space-y-2">
                                  <textarea
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    placeholder="What happened? What would you try differently?"
                                    rows={3}
                                    className="w-full rounded-2xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/40 resize-none outline-none transition-all"
                                    style={{
                                      background: "var(--surface-raised)",
                                      border: "1.5px solid transparent",
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(42,105,101,0.35)" }}
                                    onBlur={e => { e.currentTarget.style.borderColor = "transparent" }}
                                  />
                                  <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleOutcome("noted", noteText || undefined)}
                                    className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white transition-all"
                                    style={{ background: "linear-gradient(135deg, #2A6965, #3D8480)" }}
                                  >
                                    Save note →
                                  </motion.button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSkipped(true)}
                            className="w-full py-3 rounded-2xl text-[13px] font-medium text-left px-4 text-muted-foreground/50 transition-all"
                            style={{ background: "transparent" }}
                          >
                            Skip for now
                          </motion.button>
                        </div>
                      </div>
                    )}

                    {/* Scheduled, skipped outcome */}
                    {suggestion.scheduledDay && !suggestion.outcomeRating && skipped && (
                      <div className="flex items-center gap-2 px-0.5">
                        <span className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                          Scheduled for
                        </span>
                        <span className="text-[13px] font-bold" style={{ color: "#2A6965" }}>
                          {suggestion.scheduledDay}
                        </span>
                      </div>
                    )}

                    {/* Outcome captured */}
                    {suggestion.outcomeRating && (
                      <div
                        className="rounded-2xl px-4 py-3.5"
                        style={{ background: "var(--sage-light)" }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-bold text-sage">
                            {suggestion.outcomeRating === "great" ? "✨" : "📝"} Journalled
                          </span>
                          {suggestion.scheduledDay && (
                            <span className="text-[11px] text-sage/60">· {suggestion.scheduledDay}</span>
                          )}
                        </div>
                        {suggestion.outcomeNote && (
                          <p className="text-[13px] text-foreground/65 italic leading-relaxed mt-0.5">
                            &ldquo;{suggestion.outcomeNote}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Reply thread */}
                <div ref={replyRef}>
                  <ReplyThread
                    initialReplies={replies.map(toMomentReply)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {suggestion && (
      <AddToPlanSheet
        suggestion={suggestion}
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        onScheduled={handleScheduled}
      />
    )}
    </>
  )
}
