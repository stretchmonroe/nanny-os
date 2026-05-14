export type VoiceContext = "grocery" | "memory" | "schedule"
export type ActivityCategory = "meal" | "outdoor" | "play" | "nap" | "learning"

export interface GroceryResult  { type: "grocery";  items: string[] }
export interface MemoryResult   { type: "memory";   content: string; category: ActivityCategory }
export interface ScheduleResult { type: "schedule"; content: string; category: ActivityCategory; time?: string }

export type VoiceResult = GroceryResult | MemoryResult | ScheduleResult

const ADD_RE      = /^(?:add|put|get|grab|pick\s+up)\s+/i
const TIME_RE     = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i
const NAP_RE      = /\bnap\b/i
const MEAL_RE     = /\b(lunch|breakfast|dinner|snack|meal|ate|eating|feeding|fed)\b/i
const OUTDOOR_RE  = /\b(park|walk|outside|outdoor|playground|stroller)\b/i
const LEARNING_RE = /\b(read|reading|book|said|word|learned|counting|singing|song)\b/i

function detectCategory(text: string): ActivityCategory {
  if (NAP_RE.test(text))      return "nap"
  if (MEAL_RE.test(text))     return "meal"
  if (OUTDOOR_RE.test(text))  return "outdoor"
  if (LEARNING_RE.test(text)) return "learning"
  return "play"
}

export function parseVoice(text: string, context: VoiceContext): VoiceResult {
  const t = text.trim()

  if (context === "grocery") {
    const stripped = t.replace(ADD_RE, "")
    const items = stripped
      .split(/,|\band\b/i)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    return { type: "grocery", items: items.length ? items : [stripped] }
  }

  if (context === "schedule") {
    const timeMatch = t.match(TIME_RE)
    return { type: "schedule", content: t, category: detectCategory(t), time: timeMatch?.[1] }
  }

  return { type: "memory", content: t, category: detectCategory(t) }
}
