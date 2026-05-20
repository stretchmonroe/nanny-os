import { supabase } from "./client"
import { useAppStore } from "@/store/useAppStore"

type AuthorType = "nanny" | "parent"

export async function toggleReaction(
  momentId: string,
  emoji: string,
  authorType: AuthorType = "nanny",
): Promise<void> {
  try {
    const authorName = useAppStore.getState().memberNames[authorType]
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
        author_name: authorName,
        created_at:  new Date().toISOString(),
      })
    }
  } catch {
    // silent — optimistic UI already updated
  }
}
