"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { schedule as demoSchedule, typeConfig } from "@/lib/data/demo";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function normalize(raw: Record<string, unknown>) {
  return {
    id:     String(raw.id),
    time:   String(raw.time ?? ""),
    title:  String(raw.title ?? ""),
    type:   ((raw.type ?? "play") as keyof typeof typeConfig),
    done:   Boolean(raw.done),
    active: Boolean(raw.active),
    notes:  String(raw.notes ?? ""),
  };
}

type Item = ReturnType<typeof normalize>;

export default function SchedulePage() {
  const activeChild = useAppStore((s) => s.activeChild);
  const [items,   setItems]   = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (!activeChild) {
        // No real child set up yet — show demo so the UI isn't empty.
        setItems(demoSchedule.map(normalize));
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("child_id", activeChild.id)
        .eq("scheduled_date", today)
        .order("time", { ascending: true });

      setItems(data ? data.map(normalize) : []);
      setLoading(false);
    }

    load();
  }, [activeChild]);

  const completed = items.filter((i) => i.done);
  const upcoming  = items.filter((i) => !i.done);

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div className="px-5 pt-7 pb-5 border-b border-soft" style={{ background: "var(--surface-header)" }}>
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
          Schedule
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{formatDate()}</p>
        {!loading && items.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
              {completed.length} done
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-[12px] font-semibold text-muted-foreground">
              {upcoming.length} remaining
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {loading && (
          <p className="text-[13px] text-muted-foreground px-1 pt-2">Loading…</p>
        )}

        {!loading && items.length === 0 && (
          <div className="pt-12 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-[15px] font-semibold text-foreground mt-2">No schedule for today</p>
            <p className="text-[13px] text-muted-foreground max-w-[220px]">
              Schedule items logged by your caregiver will appear here.
            </p>
          </div>
        )}

        {!loading && upcoming.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">
              Upcoming
            </p>
            <div className="space-y-2">
              {upcoming.map((item) => <ScheduleBlock key={item.id} item={item} />)}
            </div>
          </section>
        )}

        {!loading && completed.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">
              Completed
            </p>
            <div className="space-y-2">
              {completed.map((item) => <ScheduleBlock key={item.id} item={item} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
