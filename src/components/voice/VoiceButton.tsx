"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"

interface Props {
  isListening: boolean
  onPress(): void
  // "pill" — circular, for inline input bars and headers
  // "row"  — full-width labeled button, for standalone sections
  variant?: "pill" | "row"
  className?: string
}

export default function VoiceButton({ isListening, onPress, variant = "pill", className = "" }: Props) {
  if (variant === "row") {
    return (
      <motion.button
        onClick={onPress}
        whileTap={{ scale: 0.97 }}
        className={`relative w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 border-soft shadow-card transition-colors duration-200 select-none ${
          isListening ? "bg-amber-400 text-amber-950" : "bg-surface-card text-foreground"
        } ${className}`}
      >
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-2xl bg-amber-400/30"
            animate={{ opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        <Mic className="w-4 h-4 relative z-10" strokeWidth={2.1} />
        <span className="text-[13px] font-semibold relative z-10">
          {isListening ? "Listening…" : "Voice"}
        </span>
      </motion.button>
    )
  }

  return (
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.88 }}
      aria-label="Voice input"
      className={`relative flex items-center justify-center rounded-full shrink-0 transition-colors duration-200 ${className}`}
    >
      {isListening && (
        <motion.span
          className="absolute inset-0 rounded-full bg-amber-400/40"
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}
      <span
        className={`relative z-10 flex items-center justify-center w-full h-full rounded-full ${
          isListening
            ? "bg-amber-400 text-amber-950"
            : "bg-surface-card border-soft shadow-card text-foreground"
        }`}
      >
        <Mic className="w-[18px] h-[18px]" strokeWidth={2.1} />
      </span>
    </motion.button>
  )
}
