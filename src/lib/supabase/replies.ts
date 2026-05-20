import { supabase } from "./client"
import type { MomentReply } from "@/lib/data/demo"
import { useAppStore } from "@/store/useAppStore"

type AuthorType = "nanny" | "parent"

export async function addReply(
  momentId: string,
  body: string,
  authorType: AuthorType = "nanny",
): Promise<MomentReply> {
  const now = new Date()
  const optimistic: MomentReply = {
    id:      `local_${Date.now()}`,
    content: body,
    author:  authorType,
    time:    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
  try {
    const authorName = useAppStore.getState().memberNames[authorType]
    const { data } = await supabase
      .from("threaded_replies")
      .insert({
        id:          crypto.randomUUID(),
        target_type: "memory_event",
        target_id:   momentId,
        body,
        author_type: authorType,
        author_name: authorName,
        created_at:  now.toISOString(),
      })
      .select("id")
      .single()
    if (data) return { ...optimistic, id: String((data as Record<string, unknown>).id) }
  } catch {
    // fall through to optimistic
  }
  return optimistic
}
