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

export function useVoiceInput(opts?: { continuous?: boolean }): VoiceInputHook {
  const continuous = opts?.continuous ?? true

  const [state, setState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const recRef = useRef<SpeechRec | null>(null)
  const stoppingRef = useRef(false)
  const stateRef = useRef<VoiceState>("idle")
  const continuousRef = useRef(continuous)

  const supported = isSupported()

  // Keep stateRef in sync so closures can read current state without going stale
  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { continuousRef.current = continuous }, [continuous])

  const start = useCallback(() => {
    if (!supported) { setState("unsupported"); return }

    stoppingRef.current = false

    const rec = createRecognition({ continuous: continuousRef.current })
    if (!rec) { setState("unsupported"); return }

    rec.onstart  = () => setState("listening")
    rec.onend    = () => {
      setInterim("")
      // In continuous mode, restart if we haven't been explicitly stopped
      if (continuousRef.current && !stoppingRef.current && stateRef.current === "listening") {
        const next = createRecognition({ continuous: true })
        if (next) {
          next.onstart  = rec.onstart
          next.onend    = rec.onend
          next.onerror  = rec.onerror
          next.onresult = rec.onresult
          recRef.current = next
          next.start()
          return
        }
      }
      setState("done")
    }
    rec.onerror  = () => { setInterim(""); setState("error") }
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

  const stop = useCallback(() => {
    stoppingRef.current = true
    recRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    stoppingRef.current = true
    recRef.current?.abort()
    recRef.current = null
    setTranscript("")
    setInterim("")
    setState("idle")
  }, [])

  useEffect(() => () => {
    stoppingRef.current = true
    recRef.current?.abort()
  }, [])

  return { state, transcript, interim, supported, start, stop, reset }
}
