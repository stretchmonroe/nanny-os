import { cn } from "@/lib/utils";
import { typeConfig } from "@/lib/data/demo";
import { Check } from "lucide-react";

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  type: keyof typeof typeConfig;
  done?: boolean;
  active?: boolean;
  notes?: string;
};

export default function ScheduleBlock({ item }: { item: ScheduleItem }) {
  const config = typeConfig[item.type] ?? typeConfig.play;

  return (
    <div
      className={cn(
        "relative flex items-start gap-4 bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm border overflow-hidden",
        item.active
          ? "border-amber-200 dark:border-amber-900/50"
          : "border-stone-100 dark:border-stone-800",
        item.done && "opacity-55"
      )}
    >
      {/* Left color bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
          item.active ? "bg-amber-400" : item.done ? "bg-stone-200 dark:bg-stone-700" : config.dot
        )}
      />

      {/* Time */}
      <div className="pl-1 shrink-0 text-center">
        <p className="text-[13px] font-bold text-zinc-900 dark:text-stone-100 tabular-nums leading-none">
          {item.time}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[14px] font-semibold leading-snug",
              item.done
                ? "line-through text-stone-400 dark:text-stone-600"
                : "text-zinc-900 dark:text-stone-100"
            )}
          >
            {item.title}
          </p>
          <div className="shrink-0 flex items-center gap-1.5">
            {item.active && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full">
                NOW
              </span>
            )}
            {item.done ? (
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : !item.active ? (
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", config.color)}>
                {config.label}
              </span>
            ) : null}
          </div>
        </div>
        {item.notes && (
          <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-0.5 leading-relaxed">
            {item.notes}
          </p>
        )}
      </div>
    </div>
  );
}
