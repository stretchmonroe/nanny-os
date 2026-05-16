"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"

interface Props {
  isListening: boolean
  onPress(): void
  // "pill" — circular, for inline input bars and headers
  // "row"  — full-width labeled button, for standalone sections
  // "fab"  — large floating action button for the BottomNav
  variant?: "pill" | "row" | "fab"
  className?: string
}

export default function VoiceButton({ isListening, onPress, variant = "pill", className = "" }: Props) {
  if (variant === "row") {
    return (
      <motion.button
        onClick={onPress}
        whileTap={{ scale: 0.97 }}
        className={`relative w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 border-soft shadow-card transition-colors duration-200 select-none ${className}`}
        style={isListening
          ? { background: "var(--accent-light)", color: "var(--accent-primary)" }
          : { background: "var(--surface-card)", color: "var(--foreground)" }
        }
      >
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{ background: "rgba(255, 123, 84, 0.15)" }}
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

  if (variant === "fab") {
    return (
      <motion.button
        onClick={onPress}
        whileTap={{ scale: 0.88 }}
        aria-label="Voice input"
        className={`relative flex items-center justify-center rounded-full shrink-0 w-14 h-14 ${className}`}
      >
        {/* Outer pulse rings when listening */}
        {isListening && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(255, 123, 84, 0.35)" }}
              animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(255, 123, 84, 0.25)" }}
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
            />
          </>
        )}
        <span
          className="relative z-10 flex items-center justify-center w-full h-full rounded-full shadow-elevated"
          style={{
            background: isListening
              ? "var(--accent-primary)"
              : "linear-gradient(135deg, var(--accent-primary), var(--accent-soft))",
          }}
        >
          <Mic className="w-6 h-6 text-white" strokeWidth={2.1} />
        </span>
      </motion.button>
    )
  }

  // pill (default)
  return (
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.88 }}
      aria-label="Voice input"
      className={`relative flex items-center justify-center rounded-full shrink-0 transition-colors duration-200 ${className}`}
    >
      {isListening && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: "rgba(255, 123, 84, 0.35)" }}
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}
      <span
        className="relative z-10 flex items-center justify-center w-full h-full rounded-full"
        style={isListening
          ? { background: "var(--accent-primary)" }
          : { background: "var(--surface-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--border-soft)" }
        }
      >
        <Mic
          className="w-[18px] h-[18px]"
          strokeWidth={2.1}
          style={{ color: isListening ? "white" : "var(--foreground)" }}
        />
      </span>
    </motion.button>
  )
}
