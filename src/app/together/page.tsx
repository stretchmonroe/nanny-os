"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import SuggestionFeed from "@/components/together/SuggestionFeed"
import { NavMenuButton } from "@/components/layout/NavMenuButton"

export default function TogetherPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div
        className="px-5 pt-9 pb-5 sticky top-0 z-10 backdrop-blur-2xl"
        style={{ background: "var(--surface-header)" }}
      >
        <div className="flex items-end justify-between mb-1">
          <div className="flex items-start gap-2.5">
            <NavMenuButton className="mt-0.5 -ml-1.5 shrink-0" />
            <div>
              <h1 className="text-[30px] font-extrabold text-foreground tracking-tight leading-none">
                Together
              </h1>
              <p className="text-[11px] font-medium text-muted-foreground/40 mt-1.5">
                Sofia · Elena · for Mateo
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setCreateOpen(true)}
            className="w-9 h-9 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-card mb-0.5"
          >
            <Plus size={16} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* Intro strip */}
      <div className="px-5 py-4">
        <p className="text-[13px] text-muted-foreground/55 leading-relaxed">
          A quiet space to share what you&apos;re noticing, ask questions, and stay aligned — not a task list, just conversation.
        </p>
      </div>

      {/* Feed */}
      <SuggestionFeed
        createOpen={createOpen}
        onCreateClose={() => setCreateOpen(false)}
      />
    </div>
  )
}
