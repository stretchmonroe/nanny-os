// SpeechRecognition engine abstraction.
// Swap createRecognition() body to use Whisper API instead of the browser API.

export interface SpeechRec extends EventTarget {
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

export interface SpeechRecEvent {
  resultIndex: number
  results: {
    length: number
    [i: number]: { isFinal: boolean; [j: number]: { transcript: string } }
  }
}

export function createRecognition(opts?: { continuous?: boolean }): SpeechRec | null {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  if (!Ctor) return null
  const rec: SpeechRec = new Ctor()
  rec.continuous = opts?.continuous ?? false
  rec.interimResults = true
  rec.lang = "en-US"
  rec.maxAlternatives = 1
  return rec
}

export function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  )
}
