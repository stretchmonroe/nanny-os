"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import WeeklyInsightCard from "./WeeklyInsightCard";
import AuthorBadge from "@/components/ui/AuthorBadge";
import type { JournalMoment } from "@/lib/data/demo";

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
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
        <p className="text-[14px] font-bold text-white leading-snug mb-2.5">
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
    <div className="px-6 py-10 text-center">
      <div className="text-[28px] text-amber-400 dark:text-amber-500 mb-4 leading-none">✦</div>
      <p className="text-[22px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-xs mx-auto">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center" />
      ) : (
        <p className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-widest">
          {moment.time}
        </p>
      )}
    </div>
  );
}

function NoteMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-6 py-6">
      <p className="text-[44px] leading-[0.75] text-amber-300 dark:text-amber-700 font-serif mb-3">&ldquo;</p>
      <p className="text-[16px] text-foreground/80 leading-relaxed font-medium mb-4">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} />
      ) : (
        <p className="text-[11px] text-muted-foreground font-semibold">{moment.time}</p>
      )}
    </div>
  );
}

export default function WeekView() {
  return (
    <div className="pb-8">
      <div className="px-4 mb-8">
        <WeeklyInsightCard />
      </div>

      <div className="space-y-10">
        {weeklyMoments.map((dayData, dayIndex) => {
          const firstPhotoId = dayData.moments.find((m) => m.type === "photo")?.id;

          return (
            <motion.div
              key={dayData.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.06, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            >
              {/* Day header */}
              <div className="flex items-end justify-between mb-3 px-5">
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
              <div>
                {dayData.moments.map((moment) => (
                  <div key={moment.id}>
                    {moment.type === "photo" && (
                      <PhotoMoment moment={moment} isFirst={moment.id === firstPhotoId} />
                    )}
                    {moment.type === "milestone" && <MilestoneMoment moment={moment} />}
                    {moment.type === "note" && <NoteMoment moment={moment} />}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
