"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { schedule as demoSchedule, dailyActivities, typeConfig } from "@/lib/data/demo";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";
import ActivityBlock from "@/components/schedule/ActivityBlock";
import type { PlannedActivity } from "@/lib/data/demo";

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

type RoutineItem = {
  id: string;
  time: string;
  title: string;
  type: keyof typeof typeConfig;
  done: boolean;
  active: boolean;
  notes: string;
};

function normalize(raw: Record<string, unknown>): RoutineItem {
  return {
    id:     String(raw.id),
    time:   String(raw.time ?? ""),
    title:  String(raw.title ?? ""),
    type:   (raw.type ?? "play") as keyof typeof typeConfig,
    done:   Boolean(raw.done),
    active: Boolean(raw.active),
    notes:  String(raw.notes ?? ""),
  };
}

type FeedItem =
  | { kind: "routine";  item: RoutineItem }
  | { kind: "activity"; activity: PlannedActivity };

// Demo: activities naturally nested within the daily rhythm
const DEMO_FEED: FeedItem[] = [
  { kind: "routine",  item: normalize(demoSchedule[0]) },   // 7:30 Breakfast
  { kind: "routine",  item: normalize(demoSchedule[1]) },   // 8:45 Morning Park
  { kind: "activity", activity: dailyActivities[0] },        // Object naming walk
  { kind: "routine",  item: normalize(demoSchedule[2]) },   // 10:00 Morning Snack
  { kind: "routine",  item: normalize(demoSchedule[3]) },   // 10:30 Sensory Bin
  { kind: "activity", activity: dailyActivities[1] },        // Pouring water station
  { kind: "routine",  item: normalize(demoSchedule[4]) },   // 12:00 Lunch
  { kind: "activity", activity: dailyActivities[2] },        // Sorting by color
  { kind: "routine",  item: normalize(demoSchedule[5]) },   // 12:45 Nap
  { kind: "routine",  item: normalize(demoSchedule[6]) },   // 14:30 Afternoon Snack
  { kind: "routine",  item: normalize(demoSchedule[7]) },   // 15:00 Reading Time
];

function buildRealFeed(routineItems: RoutineItem[]): FeedItem[] {
  if (routineItems.length === 0) {
    return dailyActivities.map((a) => ({ kind: "activity" as const, activity: a }));
  }

  const feed: FeedItem[] = [];
  const inserted = new Set<number>();

  routineItems.forEach((item, i) => {
    feed.push({ kind: "routine", item });
    // Slot activities after natural breaks: after index 1, 3, 5
    const actIdx = [1, 3, 5].indexOf(i);
    if (actIdx !== -1 && actIdx < dailyActivities.length) {
      feed.push({ kind: "activity", activity: dailyActivities[actIdx] });
      inserted.add(actIdx);
    }
  });

  // Append any unslotted activities
  dailyActivities.forEach((a, i) => {
    if (!inserted.has(i)) feed.push({ kind: "activity", activity: a });
  });

  return feed;
}

export default function DailyFlowPage() {
  const activeChild   = useAppStore((s) => s.activeChild);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = !activeChild;

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("child_id", activeChild!.id)
        .eq("scheduled_date", today)
        .order("time", { ascending: true });

      setRoutine(data ? data.map(normalize) : []);
      setLoading(false);
    }

    load();
  }, [activeChild?.id, isDemo]);

  const feed: FeedItem[] = isDemo
    ? DEMO_FEED
    : loading ? [] : buildRealFeed(routine);

  const routineDone = isDemo
    ? DEMO_FEED.filter((f) => f.kind === "routine" && f.item.done).length
    : routine.filter((i) => i.done).length;

  const routineTotal = isDemo
    ? DEMO_FEED.filter((f) => f.kind === "routine").length
    : routine.length;

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div
        className="px-5 pt-7 pb-5 border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
          Daily Flow
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{formatDate()}</p>
        {!loading && routineTotal > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground/60">
              {routineDone} of {routineTotal} routine blocks done
            </span>
            <span className="text-[11px] text-muted-foreground/40">·</span>
            <span className="text-[12px] font-semibold text-muted-foreground/50">
              {dailyActivities.length} activities
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-24 space-y-3">
        {loading && (
          <p className="text-[13px] text-muted-foreground px-1 pt-2">Loading…</p>
        )}

        {!loading && feed.length === 0 && (
          <div className="pt-12 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">🌱</span>
            <p className="text-[15px] font-semibold text-foreground mt-2">
              Your day is open
            </p>
            <p className="text-[13px] text-muted-foreground max-w-[220px] leading-relaxed">
              No routine logged yet. Suggested activities appear here as your day takes shape.
            </p>
          </div>
        )}

        {!loading && feed.map((block, i) =>
          block.kind === "routine" ? (
            <ScheduleBlock key={block.item.id} item={block.item} />
          ) : (
            <ActivityBlock key={`act-${i}`} activity={block.activity} />
          )
        )}
      </div>
    </div>
  );
}
