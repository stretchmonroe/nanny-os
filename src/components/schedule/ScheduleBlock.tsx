"use client"

import { cn } from "@/lib/utils"
import { typeConfig } from "@/lib/data/demo"
import { Check, MoreHorizontal, Pencil, Trash2, SkipForward, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"

type ItemStatus = "planned" | "completed" | "skipped" | "replaced"

type ScheduleItem = {
  id:           string
  time:         string
  title:        string
  type:         keyof typeof typeConfig
  status?:      ItemStatus
  done?:        boolean
  active?:      boolean
  notes?:       string
  description?: string
  created_by?:  "nanny" | "parent"
  completed_by?: "nanny" | "parent" | null
}

interface Props {
  item:       ScheduleItem
  onToggle?:  (id: string) => void
  onEdit?:    (id: string) => void
  onDelete?:  (id: string) => void
  onSkip?:    (id: string) => void
  onReplace?: (id: string) => void
}

const STATUS_BADGE = {
  skipped:  { label: "Skipped",  bg: "var(--surface-raised)",  color: "var(--muted-foreground)" },
  replaced: { label: "Replaced", bg: "rgba(217,119,6,0.08)",   color: "#B45309"                 },
} as const

export default function ScheduleBlock({ item, onToggle, onEdit, onDelete, onSkip, onReplace }: Props) {
  const { memberNames } = useAppStore()
  const config = typeConfig[item.type] ?? typeConfig.play
  const [menuOpen, setMenuOpen] = useState(false)

  const status   = item.status ?? (item.done ? "completed" : "planned")
  const isDone   = status === "completed"
  const isSkipped  = status === "skipped"
  const isReplaced = status === "replaced"
  const isInactive = isDone || isSkipped || isReplaced
  const isPending  = status === "planned"

  const hasActions = onEdit || onDelete || onSkip || onReplace

  return (
    <motion.div
      whileTap={isPending && onToggle ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "relative flex items-start gap-4 bg-surface-card rounded-2xl px-4 py-4 shadow-card border-soft overflow-visible transition-opacity",
        item.active && isPending && "ring-1 ring-amber-300/60 dark:ring-amber-800/40",
        isInactive && "opacity-50"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-full",
          item.active && isPending
            ? "bg-gradient-to-b from-amber-400 to-orange-400"
            : isInactive
            ? "bg-border"
            : config.dot
        )}
      />

      {/* Tappable area — toggle done */}
      <div
        className={cn(
          "flex items-start gap-4 flex-1 min-w-0 pl-1",
          isPending && onToggle && "cursor-pointer"
        )}
        onClick={() => isPending && onToggle?.(item.id)}
      >
        {/* Time */}
        <div className="shrink-0 pt-0.5">
          <p className="text-[13px] font-bold text-foreground tabular-nums leading-none">
            {item.time}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-[14px] font-semibold leading-snug tracking-tight",
                isInactive
                  ? cn("text-muted-foreground/55", (isSkipped || isReplaced) && "line-through")
                  : "text-foreground"
              )}
            >
              {item.title}
            </p>

            <div className="shrink-0 flex items-center gap-1.5">
              {item.active && isPending && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  NOW
                </span>
              )}

              {isDone ? (
                <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center">
                  <Check size={11} strokeWidth={2.5} className="text-sage" />
                </div>
              ) : isSkipped || isReplaced ? (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: STATUS_BADGE[status as "skipped" | "replaced"].bg,
                    color:      STATUS_BADGE[status as "skipped" | "replaced"].color,
                  }}
                >
                  {STATUS_BADGE[status as "skipped" | "replaced"].label}
                </span>
              ) : !item.active ? (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", config.color)}>
                  {config.label}
                </span>
              ) : null}
            </div>
          </div>

          {item.notes && (
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              {item.notes}
            </p>
          )}

          {/* Attribution */}
          {(item.created_by || item.completed_by) && (
            <div className="flex items-center gap-2 mt-1.5">
              {isDone && item.completed_by ? (
                <span className="text-[10px] text-muted-foreground/40 font-medium">
                  ✓ {memberNames[item.completed_by]}
                </span>
              ) : item.created_by && isPending ? (
                <span className="text-[10px] text-muted-foreground/35 font-medium">
                  added by {memberNames[item.created_by]}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Overflow menu */}
      {hasActions && (
        <div className="relative shrink-0 -mr-1" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:bg-muted/60"
          >
            <MoreHorizontal size={14} strokeWidth={1.8} className="text-muted-foreground/30" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[20]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -4 }}
                  transition={{ duration: 0.13 }}
                  className="absolute right-0 top-8 z-[30] rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--surface-card)",
                    border:     "1px solid var(--border-soft)",
                    boxShadow:  "var(--shadow-elevated)",
                    minWidth:   "156px",
                  }}
                >
                  {/* Status actions — only for planned items */}
                  {isPending && onToggle && (
                    <button
                      onClick={() => { setMenuOpen(false); onToggle(item.id) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-medium text-sage active:bg-muted/50"
                      style={{ borderBottom: "1px solid var(--border-soft)" }}
                    >
                      <Check size={12} strokeWidth={2} />
                      Mark done
                    </button>
                  )}
                  {isPending && onSkip && (
                    <button
                      onClick={() => { setMenuOpen(false); onSkip(item.id) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-medium text-muted-foreground/70 active:bg-muted/50"
                      style={{ borderBottom: "1px solid var(--border-soft)" }}
                    >
                      <SkipForward size={12} strokeWidth={1.8} />
                      Skip
                    </button>
                  )}
                  {isPending && onReplace && (
                    <button
                      onClick={() => { setMenuOpen(false); onReplace(item.id) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-medium text-muted-foreground/70 active:bg-muted/50"
                      style={{ borderBottom: "1px solid var(--border-soft)" }}
                    >
                      <RefreshCw size={12} strokeWidth={1.8} />
                      Replace
                    </button>
                  )}

                  {/* Edit / Delete — always shown */}
                  {onEdit && (
                    <button
                      onClick={() => { setMenuOpen(false); onEdit(item.id) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-medium text-foreground/70 active:bg-muted/50"
                      style={{ borderBottom: onDelete ? "1px solid var(--border-soft)" : "none" }}
                    >
                      <Pencil size={12} strokeWidth={1.8} />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(item.id) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-medium text-red-500/80 active:bg-red-50/40"
                    >
                      <Trash2 size={12} strokeWidth={1.8} />
                      Remove
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
