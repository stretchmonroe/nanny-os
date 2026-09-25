import type { SupabaseClient } from "@supabase/supabase-js";

// Remove the private object before its journal pointer. If Storage denies the
// deletion, keep the pointer so the parent can retry rather than orphaning bytes.
export async function deleteJournalMoment(
  db: Pick<SupabaseClient, "from" | "storage">,
  id: string,
  photoObjectPath?: string,
): Promise<void> {
  if (photoObjectPath) {
    const { error } = await db.storage.from("photos").remove([photoObjectPath]);
    if (error) throw new Error("Could not delete photo; please try again");
  }

  const { data, error } = await db.from("memory_events").delete().eq("id", id).select("id");
  if (error || !data?.length) throw new Error("Could not delete moment; please try again");
}
