import { supabase } from "@/lib/supabase/client";
import { schedule as demoSchedule, typeConfig, demoPatterns } from "@/lib/data/demo";
import ScheduleBlock from "@/components/schedule/ScheduleBlock";
import { PatternCard } from "@/components/insights/PatternCard";

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function normalize(raw: any) {
  return {
    id: raw.id ?? raw.id,
    time: raw.time,
    title: raw.title,
    type: (raw.type ?? "play") as keyof typeof typeConfig,
    done: raw.done ?? false,
    active: raw.active ?? false,
    notes: raw.notes ?? "",
  };
}

export default async function SchedulePage() {
  const { data } = await supabase.from("schedule_items").select("*");
  const items = (data && data.length > 0 ? data : demoSchedule).map(normalize);

  const completed = items.filter((i) => i.done);
  const upcoming = items.filter((i) => !i.done);

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div className="px-5 pt-7 pb-5 border-b border-soft" style={{ background: "var(--surface-header)" }}>
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
          Schedule
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">{formatDate()}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            {completed.length} done
          </span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="text-[12px] font-semibold text-muted-foreground">
            {upcoming.length} remaining
          </span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">
              Upcoming
            </p>
            <div className="space-y-2">
              {upcoming.map((item) => (
                <ScheduleBlock key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-3">
              Completed
            </p>
            <div className="space-y-2">
              {completed.map((item) => (
                <ScheduleBlock key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Pattern insight — schedule-relevant */}
        <section className="pt-2">
          <p className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest px-1 mb-2.5">
            Pattern · Mateo
          </p>
          <PatternCard pattern={demoPatterns[0]} compact />
        </section>
      </div>
    </div>
  );
}
