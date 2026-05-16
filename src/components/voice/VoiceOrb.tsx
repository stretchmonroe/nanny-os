"use client"

import { motion } from "framer-motion"
import type { VoiceState } from "@/hooks/useVoiceInput"

const PEAKS = [6, 12, 20, 26, 32, 26, 20, 12, 6]

export default function VoiceOrb({ state }: { state: VoiceState }) {
  const listening = state === "listening"

  return (
    <div className="flex items-center justify-center gap-[5px]" style={{ height: 44 }}>
      {PEAKS.map((peak, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: "linear-gradient(to top, var(--accent-primary), var(--accent-soft))" }}
          animate={{ height: listening ? [`4px`, `${peak}px`, `4px`] : `4px` }}
          transition={{
            duration: 0.55 + (i % 3) * 0.15,
            repeat: listening ? Infinity : 0,
            delay: i * 0.06,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
