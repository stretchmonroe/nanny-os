import { cn } from "@/lib/utils";
import { typeConfig } from "@/lib/data/demo";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      whileTap={!item.done ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className={cn(
        "relative flex items-start gap-4 bg-surface-card rounded-2xl px-4 py-4 shadow-card border-soft overflow-hidden transition-opacity",
        item.active && "ring-1 ring-amber-300/60 dark:ring-amber-800/40",
        item.done && "opacity-50"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-full",
          item.active
            ? "bg-gradient-to-b from-amber-400 to-orange-400"
            : item.done
            ? "bg-border"
            : config.dot
        )}
      />

      {/* Time */}
      <div className="pl-1 shrink-0">
        <p className="text-[13px] font-bold text-foreground tabular-nums leading-none">
          {item.time}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-[14px] font-semibold leading-snug tracking-tight",
              item.done ? "text-muted-foreground/55" : "text-foreground"
            )}
          >
            {item.title}
          </p>

          <div className="shrink-0 flex items-center gap-1.5">
            {item.active && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                NOW
              </span>
            )}
            {item.done ? (
              <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center">
                <Check size={11} strokeWidth={2.5} className="text-sage" />
              </div>
            ) : !item.active ? (
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", config.color)}>
                {config.label}
              </span>
            ) : null}
          </div>
        </div>

        {item.notes && (
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            {item.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
}
