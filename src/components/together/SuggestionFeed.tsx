"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import SuggestionCard from "@/components/together/SuggestionCard"
import SuggestionDetailSheet from "@/components/together/SuggestionDetailSheet"
import CreateSuggestionSheet from "@/components/together/CreateSuggestionSheet"
import { fetchSuggestions, fetchReplies } from "@/lib/supabase/suggestions"
import { demoSuggestionReplies } from "@/lib/data/demo"
import type { Suggestion, SuggestionStatus } from "@/lib/data/demo"

type Filter = "all" | "pending" | "approved"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",     label: "All"     },
  { value: "pending", label: "Pending" },
  { value: "approved",label: "Approved"},
]

interface Props {
  createOpen: boolean
  onCreateClose(): void
}

export default function SuggestionFeed({ createOpen, onCreateClose }: Props) {
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([])
  const [selected,    setSelected]        = useState<Suggestion | null>(null)
  const [filter,      setFilter]          = useState<Filter>("all")
  const [replyCounts, setReplyCounts]     = useState<Record<string, number>>({})

  const load = useCallback(async () => {
    const data = await fetchSuggestions()
    setSuggestions(data)
    // Load reply counts (use demo fallback if needed)
    const counts: Record<string, number> = {}
    for (const s of data) {
      try {
        const replies = await fetchReplies(s.id)
        counts[s.id] = replies.length
      } catch {
        counts[s.id] = demoSuggestionReplies.filter(r => r.suggestion_id === s.id).length
      }
    }
    setReplyCounts(counts)
  }, [])

  useEffect(() => { load() }, [load])

  function handleStatusChange(id: string, status: SuggestionStatus) {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  const filtered = suggestions.filter(s => {
    if (filter === "all")     return true
    if (filter === "pending") return s.status === "pending"
    if (filter === "approved")return s.status === "approved"
    return true
  })

  return (
    <>
      {/* Filter pills */}
      <div className="flex gap-1.5 px-5 mb-4">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 active:scale-[0.96]",
              filter === value
                ? "bg-foreground text-background shadow-card"
                : "bg-muted text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="px-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-14"
            >
              <p className="text-[40px] mb-3">🌱</p>
              <p className="text-[14px] font-semibold text-muted-foreground">
                Nothing shared yet
              </p>
              <p className="text-[13px] text-muted-foreground/55 mt-1">
                Elena can add a suggestion with the + button
              </p>
            </motion.div>
          )}

          {filtered.map((suggestion, i) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              replyCount={replyCounts[suggestion.id] ?? 0}
              onOpen={setSelected}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Detail sheet */}
      <SuggestionDetailSheet
        suggestion={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Create sheet */}
      <CreateSuggestionSheet
        open={createOpen}
        onClose={onCreateClose}
        onCreated={load}
      />
    </>
  )
}
