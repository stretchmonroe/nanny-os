"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createRecognition, isSupported } from "@/lib/voice/speechRecognition"
import type { SpeechRec } from "@/lib/voice/speechRecognition"

export type VoiceState = "idle" | "listening" | "done" | "error" | "unsupported"

export interface VoiceInputHook {
  state: VoiceState
  transcript: string
  interim: string
  supported: boolean
  start(): void
  stop(): void
  reset(): void
}

export function useVoiceInput(): VoiceInputHook {
  const [state, setState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const recRef = useRef<SpeechRec | null>(null)

  const supported = isSupported()

  const start = useCallback(() => {
    if (!supported) { setState("unsupported"); return }

    const rec = createRecognition()
    if (!rec) { setState("unsupported"); return }

    rec.onstart  = () => setState("listening")
    rec.onend    = () => { setInterim(""); setState("done") }
    rec.onerror  = () => setState("error")
    rec.onresult = (e) => {
      let fin = "", intr = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin  += e.results[i][0].transcript
        else                       intr += e.results[i][0].transcript
      }
      if (fin) setTranscript(prev => (prev + " " + fin).trim())
      setInterim(intr)
    }

    recRef.current = rec
    rec.start()
  }, [supported])

  const stop  = useCallback(() => recRef.current?.stop(), [])

  const reset = useCallback(() => {
    recRef.current?.abort()
    recRef.current = null
    setTranscript("")
    setInterim("")
    setState("idle")
  }, [])

  useEffect(() => () => { recRef.current?.abort() }, [])

  return { state, transcript, interim, supported, start, stop, reset }
}
