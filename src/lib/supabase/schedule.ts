import { supabase } from "@/lib/supabase/client"
import { useAppStore } from "@/store/useAppStore"

export type ActivityType = "meal" | "outdoor" | "play" | "nap" | "learning"
export type ItemStatus   = "planned" | "completed" | "skipped" | "replaced"

export interface ScheduleItem {
  id:                    string
  child_id:              string
  scheduled_date:        string
  title:                 string
  time:                  string   // flexible label: "10:30 AM", "After nap", etc.
  type:                  ActivityType
  status:                ItemStatus
  notes:                 string
  description:           string
  flexible_window_label: string
  created_by:            "nanny" | "parent"
  completed_by:          "nanny" | "parent" | null
  created_at:            string
  // ScheduleBlock compat
  done:   boolean  // true when status === 'completed'
  active: boolean  // true when status === 'planned' and time matches now ±15 min
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function rowToItem(row: Record<string, unknown>): ScheduleItem {
  const status = (row.status ?? "planned") as ItemStatus
  return {
    id:                    String(row.id ?? ""),
    child_id:              String(row.child_id ?? ""),
    scheduled_date:        String(row.scheduled_date ?? ""),
    title:                 String(row.title ?? ""),
    time:                  String(row.time ?? ""),
    type:                  (row.type ?? "play") as ActivityType,
    status,
    notes:                 String(row.notes ?? ""),
    description:           String(row.description ?? ""),
    flexible_window_label: String(row.flexible_window_label ?? ""),
    created_by:            (row.created_by ?? "nanny") as "nanny" | "parent",
    completed_by:          (row.completed_by ?? null) as "nanny" | "parent" | null,
    created_at:            String(row.created_at ?? ""),
    done:                  status === "completed",
    active:                isCurrentBlock(String(row.time ?? ""), status),
  }
}

function isCurrentBlock(timeLabel: string, status: ItemStatus): boolean {
  if (status !== "planned") return false
  // Only try if it looks like a clock time (contains digits and colon)
  if (!/\d{1,2}:\d{2}/.test(timeLabel)) return false
  const now = new Date()
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (!match) return false
  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const meridiem = (match[3] ?? "").toLowerCase()
  if (meridiem === "pm" && h < 12) h += 12
  if (meridiem === "am" && h === 12) h = 0
  const itemMinutes = h * 60 + m
  const nowMinutes  = now.getHours() * 60 + now.getMinutes()
  return Math.abs(nowMinutes - itemMinutes) <= 15
}

export function labelToISODate(label: string | null): string {
  if (!label || label === "Today") return new Date().toISOString().split("T")[0]
  // "May 13", "May 14" etc.
  const year = new Date().getFullYear()
  const parsed = new Date(`${label} ${year}`)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0]
  return new Date().toISOString().split("T")[0]
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function fetchSchedule(isoDate: string): Promise<ScheduleItem[]> {
  const { activeChildId } = useAppStore.getState()
  const { data, error } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("child_id", activeChildId)
    .eq("scheduled_date", isoDate)
    .order("time", { ascending: true })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(rowToItem)
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createScheduleItem(input: {
  title:                 string
  time:                  string
  type:                  ActivityType
  notes:                 string
  description:           string
  flexible_window_label: string
  scheduled_date:        string
}): Promise<ScheduleItem | null> {
  const { activeChildId, currentUserRole } = useAppStore.getState()
  const id = crypto.randomUUID()
  const { data, error } = await supabase
    .from("schedule_items")
    .insert({
      id,
      child_id:              activeChildId,
      scheduled_date:        input.scheduled_date,
      title:                 input.title,
      time:                  input.time,
      type:                  input.type,
      notes:                 input.notes   || null,
      description:           input.description           || null,
      flexible_window_label: input.flexible_window_label || null,
      status:                "planned",
      done:                  false,
      active:                false,
      created_by:            currentUserRole ?? "nanny",
    })
    .select()
    .single()
  if (error || !data) return null
  return rowToItem(data as Record<string, unknown>)
}

export async function updateScheduleItem(
  id: string,
  patch: {
    title?:                 string
    time?:                  string
    type?:                  ActivityType
    notes?:                 string
    description?:           string
    flexible_window_label?: string
  }
): Promise<void> {
  await supabase.from("schedule_items").update(patch).eq("id", id)
}

export async function markItemStatus(
  id:         string,
  status:     ItemStatus,
  completedBy?: "nanny" | "parent"
): Promise<void> {
  await supabase
    .from("schedule_items")
    .update({
      status,
      done:         status === "completed",
      active:       false,
      completed_by: completedBy ?? null,
    })
    .eq("id", id)
}

export async function deleteScheduleItem(id: string): Promise<void> {
  await supabase.from("schedule_items").delete().eq("id", id)
}
