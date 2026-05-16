import { supabase } from "@/lib/supabase/client"
import {
  demoSuggestions,
  demoSuggestionReplies,
  type Suggestion,
  type SuggestionReply,
  type SuggestionStatus,
} from "@/lib/data/demo"

export async function fetchSuggestions(): Promise<Suggestion[]> {
  try {
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false })
    if (error || !data || data.length === 0) return demoSuggestions
    return data as Suggestion[]
  } catch {
    return demoSuggestions
  }
}

export async function createSuggestion(
  data: Omit<Suggestion, "id" | "created_at" | "status">
): Promise<void> {
  try {
    await supabase.from("suggestions").insert({
      ...data,
      status: "pending",
      created_at: new Date().toISOString(),
    })
  } catch {
    // silent fail — optimistic local update handles the UI
  }
}

export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
  responseNote?: string
): Promise<void> {
  try {
    await supabase
      .from("suggestions")
      .update({ status, response_note: responseNote ?? null })
      .eq("id", id)
  } catch {
    // silent fail
  }
}

export async function fetchReplies(suggestionId: string): Promise<SuggestionReply[]> {
  try {
    const { data, error } = await supabase
      .from("suggestion_replies")
      .select("*")
      .eq("suggestion_id", suggestionId)
      .order("created_at", { ascending: true })
    if (error || !data) return demoSuggestionReplies.filter(r => r.suggestion_id === suggestionId)
    return data as SuggestionReply[]
  } catch {
    return demoSuggestionReplies.filter(r => r.suggestion_id === suggestionId)
  }
}

export async function addSuggestionReply(
  suggestionId: string,
  author: "nanny" | "parent",
  content: string
): Promise<void> {
  try {
    await supabase.from("suggestion_replies").insert({
      suggestion_id: suggestionId,
      author,
      content,
      created_at: new Date().toISOString(),
    })
  } catch {
    // silent fail
  }
}
