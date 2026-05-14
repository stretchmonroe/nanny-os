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
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#1A1714]">
      {/* Header */}
      <div className="px-5 pt-6 pb-5 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
        <h1 className="text-[22px] font-bold text-zinc-900 dark:text-stone-100 tracking-tight">
          Schedule
        </h1>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{formatDate()}</p>
        <div className="mt-3 flex gap-4 text-xs font-semibold">
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ {completed.length} done
          </span>
          <span className="text-stone-400 dark:text-stone-500">
            · {upcoming.length} remaining
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1 mb-2.5">
              Upcoming
            </p>
            <div className="space-y-2.5">
              {upcoming.map((item) => (
                <ScheduleBlock key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1 mb-2.5">
              Completed
            </p>
            <div className="space-y-2.5">
              {completed.map((item) => (
                <ScheduleBlock key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
