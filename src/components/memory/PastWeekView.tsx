"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { recentMemories } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";

const DAY_NAMES: Record<string, string> = {
  "May 14": "Thursday", "May 13": "Wednesday", "May 12": "Tuesday",
  "May 11": "Monday",   "May 10": "Sunday",    "May 9":  "Saturday",
  "May 8":  "Friday",   "May 7":  "Thursday",  "May 6":  "Wednesday",
  "May 5":  "Tuesday",  "May 4":  "Monday",    "May 3":  "Sunday",
  "May 2":  "Saturday", "May 1":  "Friday",
};

interface Props {
  weekLabel: string;
  range: string;
  dates: string[];
}

export default function PastWeekView({ weekLabel, range, dates }: Props) {
  const grouped = dates
    .map((date) => ({
      date,
      dayName: DAY_NAMES[date] ?? "",
      moments: recentMemories.filter((m) => m.date === date),
    }))
    .filter((g) => g.moments.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-[15px] text-muted-foreground">No memories for this week.</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="px-5 pt-5 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50">
          {weekLabel} · {range}
        </p>
      </div>

      <div className="space-y-12">
        {grouped.map((dayData, dayIndex) => {
          const firstPhotoId = dayData.moments.find((m) => m.type === "photo")?.id;

          return (
            <motion.div
              key={dayData.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.06, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            >
              {/* Day header */}
              <div className="flex items-end justify-between mb-4 px-5">
                <div>
                  <p className={cn(
                    "text-[11px] font-bold uppercase tracking-widest mb-1 text-muted-foreground/50"
                  )}>
                    {dayData.dayName}
                  </p>
                  <p className="text-[28px] font-extrabold text-foreground tracking-tight leading-none">
                    {dayData.date}
                  </p>
                </div>
              </div>

              {/* Moments */}
              <div>
                {dayData.moments.map((moment) => (
                  <div key={moment.id}>
                    {moment.type === "photo" && (
                      <div
                        className="relative w-full overflow-hidden bg-muted"
                        style={{ aspectRatio: moment.id === firstPhotoId ? "3/4" : "16/9" }}
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
                          <AuthorBadge author={moment.createdBy} time={moment.time} light />
                        </div>
                      </div>
                    )}

                    {moment.type === "milestone" && (
                      <div className="px-7 py-12 text-center">
                        <div className="text-[32px] text-amber-400 dark:text-amber-500 mb-4 leading-none select-none">
                          ✦
                        </div>
                        <p className="text-[24px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-xs mx-auto">
                          {moment.content}
                        </p>
                        <AuthorBadge
                          author={moment.createdBy}
                          time={moment.time}
                          className="justify-center mb-5"
                        />
                        <ReactionBar className="justify-center" />
                      </div>
                    )}

                    {moment.type === "note" && (
                      <div className="px-6 py-7">
                        <p className="text-[52px] leading-[0.72] text-amber-300 dark:text-amber-700 font-serif mb-3 select-none">
                          &ldquo;
                        </p>
                        <p className="text-[17px] text-foreground/80 leading-relaxed font-medium mb-4">
                          {moment.content}
                        </p>
                        <AuthorBadge author={moment.createdBy} time={moment.time} className="mb-4" />
                        <ReactionBar />
                      </div>
                    )}
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
