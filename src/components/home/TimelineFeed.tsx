"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { schedule, typeConfig } from "@/lib/data/demo";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthorBadge from "@/components/ui/AuthorBadge";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

type RealEvent = {
  id: string;
  title: string;
  notes?: string;
  time: string;
  type: keyof typeof typeConfig;
  loggedBy: "nanny" | "parent";
};

function normalize(raw: Record<string, unknown>): RealEvent {
  const ts  = raw.created_at as string | undefined;
  const cat = (raw.category as string) ?? "play";
  const type = (cat in typeConfig ? cat : "play") as keyof typeof typeConfig;
  return {
    id:       String(raw.id),
    title:    String(raw.content ?? "").split("\n")[0].slice(0, 60),
    notes:    String(raw.content ?? "").includes("\n") ? String(raw.content).split("\n").slice(1).join(" ") : undefined,
    time:     ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
    type,
    loggedBy: raw.created_by === "parent" ? "parent" : "nanny",
  };
}

export default function TimelineFeed({ childId }: { childId?: string | null }) {
  const [realEvents, setRealEvents] = useState<RealEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { profileFullName, currentUserRole } = useAppStore();

  useEffect(() => {
    if (!childId) { setLoaded(true); return; }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    supabase
      .from("memory_events")
      .select("id, type, content, category, created_at, created_by")
      .eq("child_id", childId)
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setRealEvents((data ?? []).map(normalize));
        setLoaded(true);
      });
  }, [childId]);

  // Demo mode
  if (!childId) {
    return (
      <div className="mx-5">
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em] mb-3">Today</p>
        <div className="space-y-1">
          {schedule.map((item, i) => {
            const config = typeConfig[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
                className={cn(
                  "flex items-start gap-3 px-4 py-4 rounded-2xl relative transition-colors",
                  item.active && "bg-amber-50/80 dark:bg-amber-950/20",
                  item.done && "opacity-25",
                )}
              >
                {item.active && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-gradient-to-b from-amber-400 to-orange-400 rounded-r-full" />
                )}
                <span className="text-[11px] text-muted-foreground/70 w-10 shrink-0 pt-[3px] tabular-nums font-semibold">{item.time}</span>
                <div className="flex flex-col items-center shrink-0 pt-[5px]">
                  <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", item.done ? "bg-border" : item.active ? "bg-amber-400 ring-[3px] ring-offset-1 ring-amber-200 dark:ring-amber-900" : config.dot)} />
                  {i < schedule.length - 1 && <div className="w-px flex-1 min-h-[24px] bg-border/40 mt-1.5" />}
                </div>
                <div className="flex-1 min-w-0 pb-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-[14px] font-semibold leading-snug tracking-tight", item.done ? "line-through text-muted-foreground/50" : "text-foreground")}>{item.title}</p>
                    <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                      {item.active && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">NOW</span>}
                      {item.done ? (
                        <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center"><Check size={11} strokeWidth={2.5} className="text-sage" /></div>
                      ) : !item.active ? (
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", config.color)}>{config.label}</span>
                      ) : null}
                    </div>
                  </div>
                  {item.notes && (
                    <div className="mt-0.5">
                      <p className="text-[12px] text-muted-foreground leading-relaxed">{item.notes}</p>
                      {(item.done || item.active) && "loggedBy" in item && item.loggedBy && <AuthorBadge author={item.loggedBy} className="mt-2 opacity-70" />}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!loaded) return null;

  if (realEvents.length === 0) {
    return (
      <div className="mx-5">
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em] mb-3">Today</p>
        <div className="px-4 py-6 text-center">
          <p className="text-[13px] text-muted-foreground">Nothing logged yet today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-5">
      <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em] mb-3">Today</p>
      <div className="space-y-1">
        {realEvents.map((item, i) => {
          const config = typeConfig[item.type] ?? typeConfig.play;
          const authorName = item.loggedBy === currentUserRole ? (profileFullName ?? undefined) : undefined;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-3 px-4 py-4 rounded-2xl"
            >
              <span className="text-[11px] text-muted-foreground/70 w-10 shrink-0 pt-[3px] tabular-nums font-semibold">{item.time}</span>
              <div className="flex flex-col items-center shrink-0 pt-[5px]">
                <div className={cn("w-2 h-2 rounded-full shrink-0", config.dot)} />
                {i < realEvents.length - 1 && <div className="w-px flex-1 min-h-[24px] bg-border/40 mt-1.5" />}
              </div>
              <div className="flex-1 min-w-0 pb-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-semibold leading-snug tracking-tight text-foreground">{item.title}</p>
                  <div className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={2.5} className="text-sage" />
                  </div>
                </div>
                <AuthorBadge author={item.loggedBy} name={authorName} className="mt-1.5 opacity-70" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
