"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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

// Minimal SpeechRecognition types — not yet fully in TypeScript's DOM lib
interface SpeechRec extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((e: SpeechRecEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}
interface SpeechRecEvent {
  resultIndex: number
  results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } }
}

// Swap `createRecognition` body for a Whisper fetch to replace the engine later.
function createRecognition(): SpeechRec | null {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  if (!Ctor) return null
  const rec: SpeechRec = new Ctor()
  rec.continuous = false
  rec.interimResults = true
  rec.lang = "en-US"
  rec.maxAlternatives = 1
  return rec
}

export function useVoiceInput(): VoiceInputHook {
  const [state, setState] = useState<VoiceState>("idle")
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const recRef = useRef<SpeechRec | null>(null)

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)

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
