"use client"

import { useMotionValue, useTransform, motion, AnimatePresence } from "framer-motion"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Props {
  item: { id: string; name: string; completed: boolean }
  onToggle(id: string): void
  onDelete(id: string): void
}

export default function SwipeableRow({ item, onToggle, onDelete }: Props) {
  const [removed, setRemoved] = useState(false)
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-100, -60], [1, 0])
  const deleteScale   = useTransform(x, [-100, -60], [1, 0.7])

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -72) {
      setRemoved(true)
      setTimeout(() => onDelete(item.id), 280)
    }
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
          <motion.button
            drag="x"
            dragConstraints={{ right: 0, left: -100 }}
            dragElastic={0.05}
            style={{ x }}
            onDragEnd={handleDragEnd}
            onClick={() => onToggle(item.id)}
            className="relative w-full flex items-center gap-3.5 bg-surface-card rounded-2xl px-4 py-3.5 border-soft shadow-card text-left select-none cursor-pointer"
            whileTap={{ scale: 0.985 }}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                item.completed ? "bg-sage border-sage" : "border-border"
              )}
            >
              {item.completed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              className={cn(
                "text-[14px] font-medium flex-1 transition-all duration-200",
                item.completed ? "line-through text-muted-foreground/40" : "text-foreground"
              )}
            >
              {item.name}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
