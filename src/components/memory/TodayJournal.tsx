"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment } from "@/lib/data/demo";

const today = weeklyMoments[0];

const catEmoji: Record<string, string> = {
  outdoor: "🌳", learning: "🧠", play: "🎈", meal: "🍽️", nap: "💤",
};
const catLabel: Record<string, string> = {
  outdoor: "Outdoor", learning: "Learning", play: "Play", meal: "Meal", nap: "Nap",
};

function HeroPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-muted shadow-elevated">
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/8 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5 block">
          {catEmoji[moment.category]} {catLabel[moment.category]} · {moment.time}
        </span>
        <p className="text-[15px] font-bold text-white leading-snug tracking-tight">
          {moment.content}
        </p>
      </div>
    </div>
  );
}

function MilestoneCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-amber-400 to-orange-500 p-4 flex flex-col justify-between h-48 shadow-elevated">
      <Star className="w-5 h-5 text-white/85" fill="rgba(255,255,255,0.9)" strokeWidth={0} />
      <div>
        <p className="text-[13px] font-bold text-white leading-snug mb-1.5 tracking-tight">
          {moment.content}
        </p>
        <span className="text-[10px] font-semibold text-white/65">{moment.time}</span>
      </div>
    </div>
  );
}

function SmallPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-muted h-48 shadow-elevated">
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          className="object-cover"
          sizes="(max-width: 224px) 50vw, 224px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-[11px] font-semibold text-white/90 line-clamp-2 leading-snug">
          {moment.content}
        </p>
        <span className="text-[10px] text-white/55 mt-0.5 block">{moment.time}</span>
      </div>
    </div>
  );
}

function NoteCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="rounded-3xl bg-amber-50/90 dark:bg-surface-raised border border-amber-100/60 dark:border-amber-900/20 p-5 shadow-card">
      <div className="text-xl mb-3">✍️</div>
      <p className="text-[15px] font-medium text-foreground leading-relaxed">
        {moment.content}
      </p>
      <p className="text-[11px] text-muted-foreground mt-3 font-semibold">
        {moment.time} · from nanny
      </p>
    </div>
  );
}

export default function TodayJournal() {
  const [hero, milestone, smallPhoto, note] = today.moments;

  return (
    <div className="px-4 pb-8 space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <HeroPhoto moment={hero} />
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <MilestoneCard moment={milestone} />
        {smallPhoto && <SmallPhoto moment={smallPhoto} />}
      </motion.div>

      {note && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          <NoteCard moment={note} />
        </motion.div>
      )}
    </div>
  );
}
