"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
import WeeklyRecap from "./WeeklyRecap";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import type { JournalMoment } from "@/lib/data/demo";

function stableN(id: string) {
  return id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
}

function idRotation(id: string, scale = 1): number {
  const rots = [-2.5, 1.4, -1.1, 2.7, -1.7, 1.3];
  return rots[stableN(id) % rots.length] * scale;
}

function TapeStrip({ id }: { id: string }) {
  const n = stableN(id);
  const rot = [-3, 2, -1.5, 3.5, -2.2, 1.8][(n + 1) % 6];
  const left = [40, 54, 36, 58, 45, 51][n % 6];
  return (
    <div
      className="absolute -top-3.5 z-10 w-12 h-5 rounded-sm"
      style={{
        left: `${left}%`,
        transform: `translateX(-50%) rotate(${rot}deg)`,
        background: "rgba(255, 216, 120, 0.65)",
        boxShadow: "inset 0 0 0 1px rgba(180,130,40,0.09)",
      }}
    />
  );
}

function PolaroidPhoto({ moment, isFirst }: { moment: JournalMoment; isFirst: boolean }) {
  const rot = idRotation(moment.id, isFirst ? 0.6 : 1);
  const n = stableN(moment.id);
  const isLeft = n % 2 === 0;

  return (
    <div
      className="py-3"
      style={{
        paddingLeft:  isFirst ? "20px" : (isLeft ? "16px" : "44px"),
        paddingRight: isFirst ? "20px" : (isLeft ? "44px" : "16px"),
      }}
    >
      <div className="relative mt-4">
        <TapeStrip id={moment.id} />
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-[3px] pt-3 px-3 pb-8"
          style={{
            background: "#fff",
            rotate: rot,
            boxShadow: isFirst
              ? "0 6px 32px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)"
              : "0 4px 20px rgba(0,0,0,0.11), 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="w-full rounded-[2px] overflow-hidden bg-muted relative"
            style={{ aspectRatio: isFirst ? "4/3" : "3/4" }}
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
          </div>
          <div className="mt-2.5 px-0.5">
            <p className={cn(
              "font-medium leading-snug text-stone-700",
              isFirst ? "text-[13px]" : "text-[11px]"
            )}>
              {moment.content}
            </p>
            {moment.createdBy && (
              <div className="mt-1.5 opacity-50">
                <AuthorBadge author={moment.createdBy} time={moment.time} showRole={false} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MilestoneMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="text-[11px] text-amber-300/55 select-none">✦</span>
        <span className="text-[26px] text-amber-400 dark:text-amber-500 leading-none select-none">✦</span>
        <span className="text-[11px] text-amber-300/55 select-none">✦</span>
      </div>
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
      <ReactionBar initialReactions={moment.reactions} className="justify-center" />
    </div>
  );
}

function NoteMoment({ moment }: { moment: JournalMoment }) {
  const rot = idRotation(moment.id, 0.4);
  return (
    <div className="px-5 py-3">
      <motion.div
        whileTap={{ scale: 0.985 }}
        style={{ transform: `rotate(${rot}deg)` }}
      >
        <div
          className="rounded-[1.5rem] px-6 pt-6 pb-6"
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-soft)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}
        >
          <p className="text-[44px] leading-[0.72] text-amber-300 dark:text-amber-700 font-serif mb-3 select-none">
            &ldquo;
          </p>
          <p className="text-[16px] text-foreground/80 leading-relaxed font-medium mb-4">
            {moment.content}
          </p>
          {moment.createdBy ? (
            <AuthorBadge author={moment.createdBy} time={moment.time} className="mb-4" />
          ) : (
            <p className="text-[11px] text-muted-foreground font-semibold mb-4">{moment.time}</p>
          )}
          <ReactionBar initialReactions={moment.reactions} />
        </div>
      </motion.div>
    </div>
  );
}

export default function WeekView() {
  return (
    <div className="pb-8">
      <div className="px-4 mb-8">
        <WeeklyRecap />
      </div>

      <div className="space-y-12">
        {weeklyMoments.map((dayData, dayIndex) => {
          const firstPhotoId = dayData.moments.find((m) => m.type === "photo")?.id;

          return (
            <motion.div
              key={dayData.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.06, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            >
              {/* Day header */}
              <div className="flex items-end justify-between mb-2 px-5">
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

              {/* Moments */}
              <div>
                {dayData.moments.map((moment) => (
                  <div key={moment.id}>
                    {moment.type === "photo" && (
                      <PolaroidPhoto moment={moment} isFirst={moment.id === firstPhotoId} />
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
