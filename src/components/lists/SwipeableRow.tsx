"use client"

import { useMotionValue, useTransform, motion, AnimatePresence } from "framer-motion"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { useAppStore } from "@/store/useAppStore"

interface Props {
  item:        { id: string; name: string; completed: boolean }
  createdBy?:  "nanny" | "parent"
  onToggle(id: string): void
  onDelete(id: string): void
  onRename?(id: string, name: string): void
}

export default function SwipeableRow({ item, createdBy, onToggle, onDelete, onRename }: Props) {
  const { memberNames } = useAppStore()
  const [removed,  setRemoved]  = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState(item.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0])
  const deleteScale   = useTransform(x, [-100, -60], [1, 0.7])

  // Keep draft in sync when name changes externally
  useEffect(() => {
    if (!editing) setDraft(item.name)
  }, [item.name, editing])

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -72) {
      setRemoved(true)
      setTimeout(() => onDelete(item.id), 280)
    }
  }

  function startEdit(e: React.MouseEvent) {
    if (item.completed) return
    e.stopPropagation()
    setDraft(item.name)
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 20)
  }

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== item.name) {
      onRename?.(item.id, trimmed)
    } else {
      setDraft(item.name)
    }
    setEditing(false)
  }

  return (
    <AnimatePresence>
      {!removed && (
        <motion.div
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="relative overflow-hidden rounded-2xl mb-1.5"
        >
          {/* Red delete background */}
          <motion.div
            className="absolute inset-0 rounded-2xl flex items-center justify-end pr-5"
            style={{ background: "linear-gradient(to left, #FF4D4D, #FF6B6B)" }}
          >
            <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }}>
              <Trash2 className="w-5 h-5 text-white" strokeWidth={2} />
            </motion.div>
          </motion.div>

          {/* Draggable row */}
          <motion.div
            drag={editing ? false : "x"}
            dragConstraints={{ right: 0, left: -100 }}
            dragElastic={0.05}
            style={{ x }}
            onDragEnd={handleDragEnd}
            className="relative w-full flex items-center gap-3.5 bg-surface-card rounded-2xl px-4 py-3.5 border-soft shadow-card select-none"
          >
            {/* Checkbox — tap to toggle */}
            <button
              onClick={() => onToggle(item.id)}
              className="shrink-0 active:scale-90 transition-transform"
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                  item.completed ? "bg-sage border-sage" : "border-border"
                )}
              >
                {item.completed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>

            {/* Label — tap to edit when not completed */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.currentTarget.blur(); }
                    if (e.key === "Escape") { setDraft(item.name); setEditing(false); }
                  }}
                  className="w-full text-[14px] font-medium text-foreground bg-transparent outline-none"
                />
              ) : (
                <span
                  onClick={!item.completed ? startEdit : undefined}
                  className={cn(
                    "text-[14px] font-medium block transition-all duration-200",
                    item.completed
                      ? "line-through text-muted-foreground/40"
                      : "text-foreground cursor-text"
                  )}
                >
                  {item.name}
                </span>
              )}
            </div>

            {/* Author initial — only on pending items */}
            {createdBy && !item.completed && (
              <div
                className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold select-none"
                style={{
                  background: createdBy === "nanny" ? "var(--trust-light)" : "var(--accent-light)",
                  color:      createdBy === "nanny" ? "var(--trust)"       : "var(--accent-primary)",
                }}
              >
                {(memberNames[createdBy] ?? createdBy)[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
