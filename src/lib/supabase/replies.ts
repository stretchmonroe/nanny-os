import { supabase } from "./client"
import type { MomentReply } from "@/lib/data/demo"

type AuthorType = "nanny" | "parent"
const AUTHOR_NAMES: Record<AuthorType, string> = { nanny: "Elena", parent: "Sofia" }

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
    const { data } = await supabase
      .from("threaded_replies")
      .insert({
        id:          crypto.randomUUID(),
        target_type: "memory_event",
        target_id:   momentId,
        body,
        author_type: authorType,
        author_name: AUTHOR_NAMES[authorType],
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
