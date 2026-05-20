import { supabase } from "./client"
import { useAppStore } from "@/store/useAppStore"
import type { JournalMoment, MomentReaction, MomentReply } from "@/lib/data/demo"

function rowToMoment(row: Record<string, unknown>): JournalMoment {
  const at = new Date(row.created_at as string)
  return {
    id:        String(row.id),
    type:      (row.type as JournalMoment["type"]) ?? "note",
    content:   String(row.content ?? ""),
    category:  (row.category as JournalMoment["category"]) ?? "play",
    time:      at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    imageUrl:  row.image_url ? String(row.image_url) : undefined,
    createdBy: (row.created_by as "nanny" | "parent") ?? "nanny",
  }
}

async function attachInteractions(moments: JournalMoment[]): Promise<JournalMoment[]> {
  if (moments.length === 0) return moments
  const ids = moments.map(m => m.id)

  const [{ data: rxData }, { data: rpData }] = await Promise.all([
    supabase.from("memory_reactions")
      .select("target_id, emoji, author_type")
      .eq("target_type", "memory_event")
      .in("target_id", ids),
    supabase.from("threaded_replies")
      .select("id, target_id, body, author_type, created_at")
      .eq("target_type", "memory_event")
      .in("target_id", ids)
      .order("created_at", { ascending: true }),
  ])

  const reactionsByMoment: Record<string, Record<string, ("nanny" | "parent")[]>> = {}
  for (const row of rxData ?? []) {
    const mid = row.target_id as string
    if (!reactionsByMoment[mid]) reactionsByMoment[mid] = {}
    const e = row.emoji as string
    if (!reactionsByMoment[mid][e]) reactionsByMoment[mid][e] = []
    reactionsByMoment[mid][e].push(row.author_type as "nanny" | "parent")
  }

  const repliesByMoment: Record<string, MomentReply[]> = {}
  for (const row of rpData ?? []) {
    const mid = row.target_id as string
    if (!repliesByMoment[mid]) repliesByMoment[mid] = []
    repliesByMoment[mid].push({
      id:      String(row.id),
      content: String(row.body),
      author:  row.author_type as "nanny" | "parent",
      time:    new Date(row.created_at as string).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    })
  }

  return moments.map(m => ({
    ...m,
    reactions: reactionsByMoment[m.id]
      ? Object.entries(reactionsByMoment[m.id]).map(([emoji, authors]) => ({ emoji, authors } as MomentReaction))
      : m.reactions,
    replies: repliesByMoment[m.id] ?? m.replies,
  }))
}

export async function fetchTodayMoments(): Promise<JournalMoment[]> {
  const childId = useAppStore.getState().activeChildId
  try {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const { data, error } = await supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
    if (error || !data || data.length === 0) return []
    return attachInteractions(data.map(r => rowToMoment(r as Record<string, unknown>)))
  } catch {
    return []
  }
}

export async function updateMoment(id: string, content: string): Promise<void> {
  try {
    await supabase.from("memory_events").update({ content }).eq("id", id)
  } catch {}
}

export async function deleteMoment(id: string): Promise<void> {
  try {
    await supabase.from("memory_events").delete().eq("id", id)
  } catch {}
}

export async function insertMoment(
  type: "note" | "photo" | "milestone",
  content: string,
  category: JournalMoment["category"],
  createdBy: "nanny" | "parent" = "nanny",
  imageUrl?: string,
): Promise<JournalMoment> {
  const childId = useAppStore.getState().activeChildId
  const now = new Date()
  const optimistic: JournalMoment = {
    id:       `local_${Date.now()}`,
    type,
    content,
    category,
    createdBy,
    imageUrl,
    time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
  try {
    const { data } = await supabase
      .from("memory_events")
      .insert({
        type, content, category,
        child_id:   childId,
        created_by: createdBy,
        image_url:  imageUrl ?? null,
        created_at: now.toISOString(),
      })
      .select()
      .single()
    if (data) return rowToMoment(data as Record<string, unknown>)
  } catch {
    // fall through to optimistic
  }
  return optimistic
}

// ── Shared date/grouping helpers ──────────────────────────────────────────────

const MONTH_LONG = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
]
const DAY_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

function parseDateLabel(label: string): Date {
  const now = new Date()
  if (label === "Today") return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const clean = label.replace(/^Today · /, "")
  const parts = clean.match(/^([A-Za-z]+)\s+(\d+)$/)
  if (!parts) return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const mo = MONTH_LONG.indexOf(parts[1])
  return new Date(now.getFullYear(), mo < 0 ? now.getMonth() : mo, parseInt(parts[2]))
}

// ── WeekDayGroup — live equivalent of JournalDay from demo ───────────────────

export interface WeekDayGroup {
  day:     string        // "Monday"
  date:    string        // "Today · May 14" or "May 13"
  isToday: boolean
  moments: JournalMoment[]
}

function groupRowsByDay(
  rows:    Record<string, unknown>[],
  moments: JournalMoment[],
): WeekDayGroup[] {
  const now      = new Date()
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString()
  const map      = new Map<string, { _ts: number; g: WeekDayGroup }>()

  for (let i = 0; i < rows.length; i++) {
    const at  = new Date(rows[i].created_at as string)
    const key = at.toDateString()
    if (!map.has(key)) {
      const isToday = key === todayStr
      const label   = isToday
        ? `Today · ${MONTH_LONG[at.getMonth()]} ${at.getDate()}`
        : `${MONTH_LONG[at.getMonth()]} ${at.getDate()}`
      map.set(key, {
        _ts: at.getTime(),
        g:   { day: DAY_LONG[at.getDay()], date: label, isToday, moments: [] },
      })
    }
    map.get(key)!.g.moments.push(moments[i])
  }

  return [...map.values()].sort((a, b) => b._ts - a._ts).map(({ g }) => g)
}

// ── fetchWeekMoments — last 7 calendar days ───────────────────────────────────

export async function fetchWeekMoments(): Promise<WeekDayGroup[]> {
  const childId = useAppStore.getState().activeChildId
  try {
    const now   = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
    const end   = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const { data, error } = await supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
    if (error || !data?.length) return []
    const rows    = data as Record<string, unknown>[]
    const moments = await attachInteractions(rows.map(rowToMoment))
    return groupRowsByDay(rows, moments)
  } catch {
    return []
  }
}

// ── fetchDayMoments — single calendar day by date label ──────────────────────

export async function fetchDayMoments(dateLabel: string): Promise<JournalMoment[]> {
  const childId = useAppStore.getState().activeChildId
  try {
    const d     = parseDateLabel(dateLabel)
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    const { data, error } = await supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
    if (error || !data?.length) return []
    return attachInteractions((data as Record<string, unknown>[]).map(rowToMoment))
  } catch {
    return []
  }
}

// ── fetchWeekRangeMoments — arbitrary week by array of date labels ────────────

export async function fetchWeekRangeMoments(dates: string[]): Promise<WeekDayGroup[]> {
  const childId = useAppStore.getState().activeChildId
  try {
    const parsed = dates.map(parseDateLabel).sort((a, b) => a.getTime() - b.getTime())
    if (!parsed.length) return []
    const first = parsed[0]
    const last  = parsed[parsed.length - 1]
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate())
    const end   = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    const { data, error } = await supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
    if (error || !data?.length) return []
    const rows    = data as Record<string, unknown>[]
    const moments = await attachInteractions(rows.map(rowToMoment))
    return groupRowsByDay(rows, moments)
  } catch {
    return []
  }
}

// ── FavoriteEvent + fetchFavoriteMoments ─────────────────────────────────────

export interface FavoriteEvent extends JournalMoment {
  dateLabel: string
}

export async function fetchFavoriteMoments(): Promise<FavoriteEvent[]> {
  const childId = useAppStore.getState().activeChildId
  try {
    const { data, error } = await supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })
    if (error || !data?.length) return []
    const rows   = data as Record<string, unknown>[]
    const base   = rows.map(rowToMoment)
    const withRx = await attachInteractions(base)
    return withRx.map((m, i) => ({
      ...m,
      dateLabel: new Date(rows[i].created_at as string).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      }),
    }))
  } catch {
    return []
  }
}

// ── OnThisDayResult + fetchOnThisDayMoment ───────────────────────────────────

export interface OnThisDayResult {
  moment:  JournalMoment
  daysAgo: number
}

export async function fetchOnThisDayMoment(): Promise<OnThisDayResult | null> {
  const childId = useAppStore.getState().activeChildId
  const now     = new Date()
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (const daysAgo of [365, 182, 90, 30, 14, 7]) {
    try {
      const d     = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      const { data } = await supabase
        .from("memory_events")
        .select("*")
        .eq("child_id", childId)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .neq("type", "audio")
        .order("created_at", { ascending: false })
        .limit(1)
      if (data?.length) {
        const [moment] = await attachInteractions(
          [(data as Record<string, unknown>[]).map(rowToMoment)[0]]
        )
        return { moment, daysAgo }
      }
    } catch { /* try next candidate */ }
  }
  return null
}
