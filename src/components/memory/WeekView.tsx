"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment, JournalDay, JournalMomentType, ActivityCategory } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import WeeklyRecap from "./WeeklyRecap";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import { supabase } from "@/lib/supabase/client";

function normalizeMoment(raw: Record<string, unknown>): JournalMoment {
  const ts = raw.created_at as string | undefined;
  return {
    id:        String(raw.id),
    type:      (["photo", "note", "milestone"].includes(raw.type as string) ? raw.type : "note") as JournalMomentType,
    content:   String(raw.content ?? ""),
    time:      ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
    imageUrl:  raw.image_url as string | undefined,
    category:  (raw.category ?? "play") as ActivityCategory,
    createdBy: raw.created_by === "parent" ? "parent" : "nanny",
  };
}

function groupByDay(events: Record<string, unknown>[]): JournalDay[] {
  const todayStr = new Date().toDateString();
  const map = new Map<string, JournalDay>();

  events.forEach((raw) => {
    const d    = new Date(raw.created_at as string);
    const key  = d.toDateString();
    const isToday = key === todayStr;
    if (!map.has(key)) {
      const label = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      map.set(key, {
        day:     d.toLocaleDateString("en-US", { weekday: "long" }),
        date:    isToday ? `Today · ${label}` : label,
        isToday,
        moments: [],
      });
    }
    map.get(key)!.moments.push(normalizeMoment(raw));
  });

  map.forEach((day) => day.moments.reverse());
  return Array.from(map.values());
}

function PhotoMoment({ moment, isFirst }: { moment: JournalMoment; isFirst: boolean }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-muted"
      style={{ aspectRatio: isFirst ? "3/4" : "16/9" }}
    >
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-7">
        <p className="text-[15px] font-bold text-white leading-snug mb-2.5">
          {moment.content}
        </p>
        {moment.createdBy ? (
          <AuthorBadge author={moment.createdBy} time={moment.time} light />
        ) : (
          <p className="text-[10px] text-white/50 font-medium">{moment.time}</p>
        )}
      </div>
    </div>
  );
}

function MilestoneMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-7 py-12 text-center">
      <div className="text-[32px] text-amber-400 dark:text-amber-500 mb-4 leading-none select-none">✦</div>
      <p className="text-[24px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-xs mx-auto">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center mb-5" />
      ) : (
        <p className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-widest mb-5">
          {moment.time}
        </p>
      )}
      {/* Reactions only for week view — keep it light */}
      <ReactionBar initialReactions={moment.reactions} className="justify-center" />
    </div>
  );
}

function NoteMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-6 py-7">
      <p className="text-[52px] leading-[0.72] text-amber-300 dark:text-amber-700 font-serif mb-3 select-none">&ldquo;</p>
      <p className="text-[17px] text-foreground/80 leading-relaxed font-medium mb-4">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="mb-4" />
      ) : (
        <p className="text-[11px] text-muted-foreground font-semibold mb-4">{moment.time}</p>
      )}
      <ReactionBar initialReactions={moment.reactions} />
    </div>
  );
}

function DaySection({ dayData, dayIndex }: { dayData: JournalDay; dayIndex: number }) {
  const firstPhotoId = dayData.moments.find((m) => m.type === "photo")?.id;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.06, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="flex items-end justify-between mb-4 px-5">
        <div>
          <p className={cn(
            "text-[11px] font-bold uppercase tracking-widest mb-1",
            dayData.isToday ? "text-amber-500" : "text-muted-foreground/50"
          )}>
            {dayData.day}
          </p>
          <p className="text-[28px] font-extrabold text-foreground tracking-tight leading-none">
            {dayData.date.replace("Today · ", "")}
          </p>
        </div>
        {dayData.isToday && (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/30 px-3 py-1.5 rounded-full uppercase tracking-widest">
            Today
          </span>
        )}
      </div>
      <div>
        {dayData.moments.map((moment) => (
          <div key={moment.id}>
            {moment.type === "photo"     && <PhotoMoment moment={moment} isFirst={moment.id === firstPhotoId} />}
            {moment.type === "milestone" && <MilestoneMoment moment={moment} />}
            {moment.type === "note"      && <NoteMoment moment={moment} />}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function WeekView({ childId }: { childId?: string | null }) {
  const [realDays,   setRealDays]   = useState<JournalDay[]>([]);
  const [status,     setStatus]     = useState<"idle" | "loading" | "done">("idle");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    if (!childId) { setStatus("idle"); return; }

    setStatus("loading");

    const end   = new Date();
    end.setDate(end.getDate() + weekOffset * 7);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .in("type", ["note", "photo", "milestone"])
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRealDays(groupByDay(data ?? []));
        setStatus("done");
      });
  }, [childId, weekOffset]);

  function weekLabel() {
    if (weekOffset === 0) return "This week";
    if (weekOffset === -1) return "Last week";
    const end = new Date();
    end.setDate(end.getDate() + weekOffset * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  // Demo mode
  if (!childId) {
    return (
      <div className="pb-8">
        <div className="px-4 mb-8"><WeeklyRecap /></div>
        <div className="space-y-12">
          {weeklyMoments.map((dayData, i) => (
            <DaySection key={dayData.date} dayData={dayData} dayIndex={i} />
          ))}
        </div>
      </div>
    );
  }

  if (status !== "done") return null;

  const nav = (
    <div className="flex items-center justify-between px-5 mb-6">
      <button
        onClick={() => setWeekOffset((w) => w - 1)}
        className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform"
      >
        <ChevronLeft size={16} className="text-muted-foreground" />
      </button>
      <p className="text-[13px] font-bold text-muted-foreground">{weekLabel()}</p>
      <button
        onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
        disabled={weekOffset === 0}
        className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
      >
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>
    </div>
  );

  // Real — empty
  if (realDays.length === 0) {
    return (
      <div className="pb-8">
        {nav}
        <div className="flex flex-col items-center gap-2 text-center pt-8 pb-8 px-6">
          <span className="text-4xl">🗓️</span>
          <p className="text-[15px] font-semibold text-foreground mt-2">Nothing logged this week</p>
          <p className="text-[13px] text-muted-foreground max-w-[230px] leading-relaxed">
            Use the arrows to browse other weeks.
          </p>
        </div>
      </div>
    );
  }

  // Real — has moments
  return (
    <div className="pb-8">
      {nav}
      <div className="space-y-12">
        {realDays.map((dayData, i) => (
          <DaySection key={dayData.date} dayData={dayData} dayIndex={i} />
        ))}
      </div>
    </div>
  );
}
