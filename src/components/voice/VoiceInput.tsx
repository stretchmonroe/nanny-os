"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"
import { useVoiceInput } from "@/hooks/useVoiceInput"
import VoiceSheet from "./VoiceSheet"
import { parseVoice, type VoiceContext, type VoiceResult } from "@/lib/voice/parser"

interface Props {
  context: VoiceContext
  onSave(result: VoiceResult): void
  // "pill"  — circular button, use inline in input bars and headers
  // "row"   — full-width labeled button, use as a standalone section
  variant?: "pill" | "row"
  className?: string
}

export default function VoiceInput({ context, onSave, variant = "pill", className = "" }: Props) {
  const voice = useVoiceInput()

  function handlePress() {
    if (!voice.supported) return
    if (voice.state === "idle" || voice.state === "error") {
      navigator.vibrate?.(40)
      voice.start()
    } else if (voice.state === "listening") {
      voice.stop()
    }
  }

  function handleSave(text: string) {
    onSave(parseVoice(text, context))
  }

  const listening = voice.state === "listening"

  const trigger =
    variant === "row" ? (
      <motion.button
        onClick={handlePress}
        whileTap={{ scale: 0.97 }}
        className={`relative w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 border-soft shadow-card transition-colors duration-200 select-none ${
          listening
            ? "bg-amber-400 text-amber-950"
            : "bg-surface-card text-foreground"
        } ${className}`}
      >
        {listening && (
          <motion.span
            className="absolute inset-0 rounded-2xl bg-amber-400/30"
            animate={{ opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
        <Mic className="w-4 h-4 relative z-10" strokeWidth={2.1} />
        <span className="text-[13px] font-semibold relative z-10">
          {listening ? "Listening…" : "Voice"}
        </span>
      </motion.button>
    ) : (
      <motion.button
        onClick={handlePress}
        whileTap={{ scale: 0.88 }}
        aria-label="Voice input"
        className={`relative flex items-center justify-center rounded-full shrink-0 transition-colors duration-200 ${className}`}
      >
        {listening && (
          <motion.span
            className="absolute inset-0 rounded-full bg-amber-400/40"
            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          />
        )}
        <span
          className={`relative z-10 flex items-center justify-center w-full h-full rounded-full ${
            listening
              ? "bg-amber-400 text-amber-950"
              : "bg-surface-card border-soft shadow-card text-foreground"
          }`}
        >
          <Mic className="w-[18px] h-[18px]" strokeWidth={2.1} />
        </span>
      </motion.button>
    )

  return (
    <>
      {trigger}
      <VoiceSheet
        state={voice.state}
        transcript={voice.transcript}
        interim={voice.interim}
        context={context}
        onStop={voice.stop}
        onSave={handleSave}
        onCancel={voice.reset}
      />
    </>
  )
}
