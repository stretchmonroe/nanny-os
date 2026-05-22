"use client"

import { useVoiceInput } from "@/hooks/useVoiceInput"
import { parseVoice, type VoiceContext, type VoiceResult } from "@/lib/voice/transcriptParser"
import VoiceButton from "./VoiceButton"
import VoiceInputModal from "./VoiceInputModal"

interface Props {
  context: VoiceContext
  onSave(result: VoiceResult): void
  variant?: "pill" | "row"
  className?: string
}

export default function VoiceRecorder({ context, onSave, variant = "pill", className }: Props) {
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

  return (
    <>
      <VoiceButton
        isListening={voice.state === "listening"}
        onPress={handlePress}
        variant={variant}
        className={className}
      />
      <VoiceInputModal
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
