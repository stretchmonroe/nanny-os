"use client"

import { motion } from "framer-motion"
import AuthorBadge from "@/components/ui/AuthorBadge"
import type { Suggestion } from "@/lib/data/demo"

const CATEGORY_CONFIG = {
  activity: { emoji: "🎯", label: "Activity", accent: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  food:     { emoji: "🥣", label: "Food",     accent: "#10B981", bg: "rgba(16,185,129,0.08)" },
  schedule: { emoji: "🗓", label: "Schedule", accent: "#0EA5E9", bg: "rgba(14,165,233,0.08)" },
}

const STATUS_CONFIG = {
  pending:  { label: "Waiting for Sofia", bg: "rgba(217,119,6,0.08)",  color: "#B45309" },
  approved: { label: "✓ Sofia approved",  bg: "var(--sage-light)",      color: "var(--sage)"   },
  rejected: { label: "Not this time",     bg: "var(--surface-page)",   color: "var(--muted-foreground)" },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

interface Props {
  suggestion: Suggestion
  replyCount?: number
  onOpen(s: Suggestion): void
  index?: number
}

export default function SuggestionCard({ suggestion, replyCount = 0, onOpen, index = 0 }: Props) {
  const cat    = CATEGORY_CONFIG[suggestion.type]
  const status = STATUS_CONFIG[suggestion.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
    >
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={() => onOpen(suggestion)}
        className="w-full text-left mb-3"
      >
        <div
          className="rounded-2xl overflow-hidden shadow-card"
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-soft)",
            borderLeft: `3px solid ${cat.accent}`,
          }}
        >
          <div className="px-4 pt-3.5 pb-4">
            {/* Top row: category chip + status */}
            <div className="flex items-center justify-between mb-2.5">
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: cat.bg, color: cat.accent }}
              >
                {cat.emoji} {cat.label}
              </span>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: status.bg, color: status.color }}
              >
                {status.label}
              </span>
            </div>

            {/* Title */}
            <p className="text-[15px] font-semibold text-foreground leading-snug mb-2.5">
              {suggestion.title}
            </p>

            {/* Author + reply count */}
            <div className="flex items-center justify-between">
              <AuthorBadge
                author={suggestion.created_by}
                time={formatTime(suggestion.created_at)}
                showRole={false}
                variant="inline"
              />
              {replyCount > 0 && (
                <span className="text-[12px] font-medium text-muted-foreground/55">
                  💬 {replyCount}
                </span>
              )}
            </div>

            {/* Workflow stage trail */}
            {suggestion.status === "approved" && (suggestion.scheduledDay || suggestion.outcomeRating) && (
              <div
                className="mt-3 pt-3 flex items-center gap-1.5"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
                {suggestion.outcomeRating ? (
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "var(--sage-light)", color: "var(--sage)" }}
                  >
                    {suggestion.outcomeRating === "great" ? "✨" : "📝"} Journalled
                  </span>
                ) : suggestion.scheduledDay ? (
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(42,105,101,0.08)", color: "#2A6965" }}
                  >
                    📅 {suggestion.scheduledDay}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </motion.button>
    </motion.div>
  )
}
