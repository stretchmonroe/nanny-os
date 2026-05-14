"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment } from "@/lib/data/demo";

const today = weeklyMoments[0];

const catEmoji: Record<string, string> = {
  outdoor: "🌳", learning: "🧠", play: "🎈", meal: "🍽️", nap: "💤",
};

function PhotoCard({ moment, priority = false }: { moment: JournalMoment; priority?: boolean }) {
  return (
    <div
      className="relative w-full rounded-[2rem] overflow-hidden bg-muted shadow-elevated"
      style={{ aspectRatio: "4/5" }}
    >
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">
          {catEmoji[moment.category]} {moment.time}
        </p>
        <p className="text-[18px] font-bold text-white leading-snug tracking-tight">
          {moment.content}
        </p>
      </div>
    </div>
  );
}

function MilestoneCard({ moment }: { moment: JournalMoment }) {
  return (
    <div
      className="rounded-[2rem] overflow-hidden shadow-elevated"
      style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
    >
      <div className="p-7">
        <div className="text-[22px] mb-5 text-amber-900/60">✦</div>
        <p className="text-[22px] font-extrabold text-amber-950 leading-snug tracking-tight mb-4">
          {moment.content}
        </p>
        <p className="text-[11px] font-bold text-amber-900/50 uppercase tracking-widest">
          {moment.time}
        </p>
      </div>
    </div>
  );
}

function NoteCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="rounded-[2rem] bg-[#FBF8F2] dark:bg-surface-raised p-7 shadow-card border border-amber-100/60 dark:border-amber-900/20">
      <p className="text-[17px] font-medium text-foreground leading-[1.7] mb-5">
        {moment.content}
      </p>
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-amber-200/80 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">E</span>
        </div>
        <p className="text-[12px] text-muted-foreground font-semibold">
          Elena · {moment.time}
        </p>
      </div>
    </div>
  );
}

export default function TodayJournal() {
  return (
    <div className="px-4 pb-8 space-y-4">
      {today.moments.map((moment, i) => (
        <motion.div
          key={moment.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 + i * 0.09, duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
        >
          {moment.type === "photo"     && <PhotoCard     moment={moment} priority={i === 0} />}
          {moment.type === "milestone" && <MilestoneCard moment={moment} />}
          {moment.type === "note"      && <NoteCard      moment={moment} />}
        </motion.div>
      ))}
    </div>
  );
}
