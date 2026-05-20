import { supabase } from "@/lib/supabase/client"
import { useAppStore } from "@/store/useAppStore"
import type {
  Suggestion,
  SuggestionReply,
  SuggestionStatus,
} from "@/lib/data/demo"

// DB column "body" ↔ code field "description"
// DB status "dismissed" ↔ code status "rejected"

function rowToSuggestion(row: Record<string, unknown>): Suggestion {
  return {
    id:            row.id           as string,
    type:          row.type         as Suggestion["type"],
    title:         row.title        as string,
    description:   row.body         as string,
    reason:        (row.reason      as string | null) ?? "",
    created_by:    row.created_by   as "nanny" | "parent",
    status:        row.status === "dismissed" ? "rejected" : row.status as SuggestionStatus,
    response_note: row.response_note as string | undefined,
    child_id:      row.child_id     as string,
    created_at:    row.created_at   as string,
    scheduledDay:  row.scheduled_day  as string | undefined,
    outcomeRating: row.outcome_rating as "great" | "noted" | undefined,
    outcomeNote:   row.outcome_note   as string | undefined,
    researchBacked: row.research_backed as boolean | undefined,
  }
}

export async function fetchSuggestions(): Promise<Suggestion[]> {
  const { activeChildId } = useAppStore.getState()
  const { data, error } = await supabase
    .from("suggestions")
    .select("*")
    .eq("child_id", activeChildId)
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data.map(rowToSuggestion)
}

export async function createSuggestion(
  input: Omit<Suggestion, "id" | "created_at" | "status">
): Promise<void> {
  await supabase.from("suggestions").insert({
    type:           input.type,
    title:          input.title,
    body:           input.description,
    reason:         input.reason || null,
    created_by:     input.created_by,
    child_id:       input.child_id,
    research_backed: input.researchBacked ?? false,
    status:         "pending",
    created_at:     new Date().toISOString(),
  })
}

export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
  responseNote?: string
): Promise<void> {
  const dbStatus = status === "rejected" ? "dismissed" : status
  await supabase
    .from("suggestions")
    .update({ status: dbStatus, response_note: responseNote ?? null })
    .eq("id", id)
}

export async function deleteSuggestion(id: string): Promise<void> {
  await supabase.from("suggestions").delete().eq("id", id)
}

export async function fetchReplies(suggestionId: string): Promise<SuggestionReply[]> {
  const { data, error } = await supabase
    .from("suggestion_replies")
    .select("*")
    .eq("suggestion_id", suggestionId)
    .order("created_at", { ascending: true })
  if (error || !data) return []
  return data as SuggestionReply[]
}

export async function addSuggestionReply(
  suggestionId: string,
  author: "nanny" | "parent",
  content: string
): Promise<SuggestionReply> {
  const { data, error } = await supabase
    .from("suggestion_replies")
    .insert({
      suggestion_id: suggestionId,
      author,
      content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error || !data) throw error
  return data as SuggestionReply
}

export async function deleteSuggestionReply(id: string): Promise<void> {
  await supabase.from("suggestion_replies").delete().eq("id", id)
}

export async function updateSuggestionWorkflow(
  id: string,
  patch: {
    scheduledDay?:  string
    outcomeRating?: "great" | "noted"
    outcomeNote?:   string
  }
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.scheduledDay  !== undefined) update.scheduled_day  = patch.scheduledDay
  if (patch.outcomeRating !== undefined) update.outcome_rating = patch.outcomeRating
  if (patch.outcomeNote   !== undefined) update.outcome_note   = patch.outcomeNote
  if (Object.keys(update).length > 0) {
    await supabase.from("suggestions").update(update).eq("id", id)
  }
}
