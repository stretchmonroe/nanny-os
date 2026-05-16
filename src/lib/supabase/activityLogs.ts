import { supabase } from "./client";
import type { TimeWindow } from "@/lib/activities";
import type { ActivityStatus, ActivityOutcome } from "@/lib/execution";

export interface ActivityLog {
  date: string;
  child_id: string;
  time_window: TimeWindow;
  planned_title: string;
  planned_category: string;
  status: ActivityStatus;
  outcome?: ActivityOutcome;
  note?: string;
  replaced_by?: string;
}

export async function saveActivityLog(log: ActivityLog): Promise<void> {
  try {
    await supabase.from("activity_logs").upsert(
      { ...log, created_at: new Date().toISOString() },
      { onConflict: "date,child_id,time_window" }
    );
  } catch {
    // degrade silently — sessionStorage is the source of truth
  }
}

export async function fetchRecentLogs(childId: string, days = 7): Promise<ActivityLog[]> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("child_id", childId)
      .gte("date", since.toISOString().slice(0, 10))
      .order("date", { ascending: false });
    return (data ?? []) as ActivityLog[];
  } catch {
    return [];
  }
}
