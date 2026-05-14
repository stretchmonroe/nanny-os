"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment } from "@/lib/data/demo";

const today = weeklyMoments[0];

const catEmoji: Record<string, string> = {
  outdoor: "🌳",
  learning: "🧠",
  play: "🎈",
  meal: "🍽️",
  nap: "💤",
};

const catLabel: Record<string, string> = {
  outdoor: "Outdoor",
  learning: "Learning",
  play: "Play",
  meal: "Meal",
  nap: "Nap",
};

function HeroPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 shadow-md">
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/65 mb-1 block">
          {catEmoji[moment.category]} {catLabel[moment.category]} · {moment.time}
        </span>
        <p className="text-[15px] font-semibold text-white leading-snug">{moment.content}</p>
      </div>
    </div>
  );
}

function MilestoneCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-4 flex flex-col justify-between h-48 shadow-md">
      <Star className="w-5 h-5 text-white/90" fill="white" strokeWidth={0} />
      <div>
        <p className="text-[13px] font-bold text-white leading-snug mb-1.5">
          {moment.content}
        </p>
        <span className="text-[10px] font-medium text-white/70">{moment.time}</span>
      </div>
    </div>
  );
}

function SmallPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-800 h-48 shadow-md">
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          className="object-cover"
          sizes="(max-width: 224px) 50vw, 224px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-[11px] font-medium text-white/90 line-clamp-2 leading-snug">
          {moment.content}
        </p>
        <span className="text-[10px] text-white/60 mt-0.5 block">{moment.time}</span>
      </div>
    </div>
  );
}

function NoteCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="rounded-3xl bg-amber-50/80 dark:bg-stone-800 border border-amber-100/60 dark:border-stone-700 p-5 shadow-sm">
      <div className="text-2xl mb-3">✍️</div>
      <p className="text-[15px] font-medium text-zinc-800 dark:text-stone-100 leading-relaxed">
        {moment.content}
      </p>
      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-3 font-medium">
        {moment.time} · from nanny
      </p>
    </div>
  );
}

export default function TodayJournal() {
  const [hero, milestone, smallPhoto, note] = today.moments;

  return (
    <div className="px-4 pb-8 space-y-3">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <HeroPhoto moment={hero} />
      </motion.div>

      {/* Milestone + small photo side-by-side */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <MilestoneCard moment={milestone} />
        {smallPhoto && <SmallPhoto moment={smallPhoto} />}
      </motion.div>

      {/* Note */}
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
