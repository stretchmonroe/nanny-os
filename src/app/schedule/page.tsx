"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { schedule as demoSchedule, dailyActivities, typeConfig } from "@/lib/data/demo";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";
import ActivityBlock from "@/components/schedule/ActivityBlock";
import LogRoutineSheet from "@/components/schedule/LogRoutineSheet";
import SuggestionsCarousel from "@/components/schedule/SuggestionsCarousel";
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

function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function withActive(items: RoutineItem[]): RoutineItem[] {
  if (items.length === 0) return items;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let activeIdx = -1;
  items.forEach((item, i) => {
    if (!item.done && toMins(item.time) <= nowMins) activeIdx = i;
  });
  return items.map((item, i) => ({ ...item, active: i === activeIdx }));
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDemo = !activeChild;

  async function toggleDone(id: string) {
    const item = routine.find((r) => r.id === id);
    if (!item) return;
    const next = !item.done;
    const updated = routine.map((r) => r.id === id ? { ...r, done: next } : r);
    setRoutine(withActive(updated));
    await supabase.from("schedule_items").update({ done: next }).eq("id", id);
  }

  async function loadRoutine() {
    if (!activeChild) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("schedule_items")
      .select("*")
      .eq("child_id", activeChild.id)
      .eq("scheduled_date", today)
      .order("time", { ascending: true });
    setRoutine(data ? withActive(data.map(normalize)) : []);
    setLoading(false);
  }

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("child_id", activeChild!.id)
        .eq("scheduled_date", today)
        .order("time", { ascending: true });
      setRoutine(data ? withActive(data.map(normalize)) : []);
      setLoading(false);
    })();
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
              Daily Flow
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{formatDate()}</p>
          </div>
          {!isDemo && (
            <button
              onClick={() => setSheetOpen(true)}
              className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center active:scale-[0.94] transition-transform mt-1"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
        {!loading && routineTotal > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground/60">
              {routineDone} of {routineTotal} routine blocks done
            </span>
            <span className="text-[11px] text-muted-foreground/40">·</span>
            <span className="text-[12px] font-semibold text-muted-foreground/50">
              {dailyActivities.length} suggestions
            </span>
          </div>
        )}
      </div>

      <div className="pt-4 pb-24">
        {loading && (
          <p className="text-[13px] text-muted-foreground px-5 pt-2">Loading…</p>
        )}

        {/* Suggestions carousel — shown for real children (always) and empty state */}
        {!loading && !isDemo && (
          <SuggestionsCarousel
            birthDate={activeChild?.birthDate}
            childId={activeChild?.id}
            className="mb-5"
          />
        )}

        {!loading && routine.length === 0 && !isDemo && (
          <div className="px-5 pt-4 pb-4 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">🌱</span>
            <p className="text-[15px] font-semibold text-foreground mt-2">
              Your routine is open
            </p>
            <p className="text-[13px] text-muted-foreground max-w-[220px] leading-relaxed">
              Tap <span className="font-bold">+</span> to log a meal, nap, or any block as it happens.
            </p>
          </div>
        )}

        <div className="px-4 space-y-3">
          {!loading && feed.map((block, i) =>
            block.kind === "routine" ? (
              <ScheduleBlock
                key={block.item.id}
                item={block.item}
                onToggleDone={isDemo ? undefined : () => toggleDone(block.item.id)}
              />
            ) : (
              isDemo ? <ActivityBlock key={`act-${i}`} activity={block.activity} /> : null
            )
          )}
        </div>
      </div>

      {!isDemo && activeChild && (
        <LogRoutineSheet
          open={sheetOpen}
          childId={activeChild.id}
          onClose={() => setSheetOpen(false)}
          onSaved={loadRoutine}
        />
      )}
    </div>
  );
}
