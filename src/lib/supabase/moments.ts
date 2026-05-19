import { supabase } from "./client"
import { weeklyMoments } from "@/lib/data/demo"
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
  try {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const { data, error } = await supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", "default")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
    if (error || !data || data.length === 0) return weeklyMoments[0].moments
    return attachInteractions(data.map(r => rowToMoment(r as Record<string, unknown>)))
  } catch {
    return weeklyMoments[0].moments
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
        child_id:   "default",
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
