import { supabase } from "./client"

type AuthorType = "nanny" | "parent"
const AUTHOR_NAMES: Record<AuthorType, string> = { nanny: "Elena", parent: "Sofia" }

export async function toggleReaction(
  momentId: string,
  emoji: string,
  authorType: AuthorType = "nanny",
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from("memory_reactions")
      .select("id")
      .eq("target_type", "memory_event")
      .eq("target_id", momentId)
      .eq("emoji", emoji)
      .eq("author_type", authorType)
      .maybeSingle()
    if (existing) {
      await supabase.from("memory_reactions").delete().eq("id", existing.id)
    } else {
      await supabase.from("memory_reactions").insert({
        id:          crypto.randomUUID(),
        target_type: "memory_event",
        target_id:   momentId,
        emoji,
        author_type: authorType,
        author_name: AUTHOR_NAMES[authorType],
        created_at:  new Date().toISOString(),
      })
    }
  } catch {
    // silent — optimistic UI already updated
  }
}
