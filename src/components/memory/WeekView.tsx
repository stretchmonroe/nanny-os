"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import WeeklyInsightCard from "./WeeklyInsightCard";
import type { JournalMoment } from "@/lib/data/demo";

function PhotoMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-muted shadow-elevated"
      style={{ aspectRatio: "4/3" }}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-[14px] font-semibold text-white leading-snug">
          {moment.content}
        </p>
        <p className="text-[10px] text-white/50 mt-1.5 font-medium">{moment.time}</p>
      </div>
    </div>
  );
}

function MilestoneMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/15 border border-amber-100/80 dark:border-amber-900/25 px-5 py-4">
      <span className="text-amber-500 text-[15px] shrink-0 mt-0.5 font-bold">✦</span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground leading-snug">
          {moment.content}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{moment.time}</p>
      </div>
    </div>
  );
}

function NoteMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="rounded-2xl bg-surface-card border-soft px-5 py-4 shadow-card">
      <p className="text-[14px] text-foreground/80 leading-relaxed font-medium">
        {moment.content}
      </p>
      <p className="text-[11px] text-muted-foreground mt-2.5 font-semibold">{moment.time}</p>
    </div>
  );
}

export default function WeekView() {
  return (
    <div className="px-4 pb-8 space-y-8">
      <WeeklyInsightCard />

      {weeklyMoments.map((dayData, dayIndex) => (
        <motion.div
          key={dayData.date}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIndex * 0.06, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Day header */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-widest mb-1",
                  dayData.isToday ? "text-amber-500" : "text-muted-foreground/55"
                )}
              >
                {dayData.day}
              </p>
              <p className="text-[26px] font-extrabold text-foreground tracking-tight leading-none">
                {dayData.date.replace("Today · ", "")}
              </p>
            </div>
            {dayData.isToday && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/30 px-3 py-1.5 rounded-full uppercase tracking-widest">
                Today
              </span>
            )}
          </div>

          {/* Moments */}
          <div className="space-y-3">
            {dayData.moments.map((moment) => (
              <div key={moment.id}>
                {moment.type === "photo"     && <PhotoMoment     moment={moment} />}
                {moment.type === "milestone" && <MilestoneMoment moment={moment} />}
                {moment.type === "note"      && <NoteMoment      moment={moment} />}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
