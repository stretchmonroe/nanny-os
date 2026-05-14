"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";

const today = weeklyMoments[0];

function HeroPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "3/4" }}>
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        <p className="text-[20px] font-bold text-white leading-snug tracking-tight mb-3">
          {moment.content}
        </p>
        {moment.createdBy && (
          <AuthorBadge author={moment.createdBy} time={moment.time} light />
        )}
      </div>
    </div>
  );
}

function InsetPhoto({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-5 py-5">
      <div
        className="relative w-full rounded-[1.5rem] overflow-hidden bg-muted shadow-elevated"
        style={{ aspectRatio: "4/3" }}
      >
        {moment.imageUrl && (
          <Image
            src={moment.imageUrl}
            alt={moment.content}
            fill
            className="object-cover"
            sizes="(max-width: 416px) 100vw, 416px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[16px] font-bold text-white leading-snug tracking-tight mb-2.5">
            {moment.content}
          </p>
          {moment.createdBy && (
            <AuthorBadge author={moment.createdBy} time={moment.time} light />
          )}
        </div>
      </div>
    </div>
  );
}

function MilestonePanel({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-8 py-16 text-center">
      <div className="text-[42px] text-amber-400 dark:text-amber-500 mb-5 leading-none">✦</div>
      <p className="text-[28px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-[260px] mx-auto">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center mb-6" />
      ) : (
        <p className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-widest mb-6">
          {moment.time}
        </p>
      )}
      <ReactionBar initialReactions={moment.reactions} className="justify-center" />
      <div className="mt-5 text-left max-w-[300px] mx-auto">
        <ReplyThread initialReplies={moment.replies} />
      </div>
    </div>
  );
}

function NoteCard({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-8 py-10">
      <p className="text-[64px] leading-[0.65] text-amber-300 dark:text-amber-700 font-serif mb-4 select-none">&ldquo;</p>
      <p className="text-[20px] font-medium text-foreground leading-[1.7] mb-5">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="mb-5" />
      ) : (
        <p className="text-[12px] text-muted-foreground font-semibold mb-5">{moment.time}</p>
      )}
      <ReactionBar initialReactions={moment.reactions} className="mb-5" />
      <ReplyThread initialReplies={moment.replies} />
    </div>
  );
}

export default function TodayJournal() {
  const firstPhotoId = today.moments.find((m) => m.type === "photo")?.id;

  return (
    <div className="pb-8">
      {today.moments.map((moment, i) => (
        <motion.div
          key={moment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 + i * 0.09, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
        >
          {moment.type === "photo" && moment.id === firstPhotoId && <HeroPhoto moment={moment} />}
          {moment.type === "photo" && moment.id !== firstPhotoId && <InsetPhoto moment={moment} />}
          {moment.type === "milestone" && <MilestonePanel moment={moment} />}
          {moment.type === "note" && <NoteCard moment={moment} />}
        </motion.div>
      ))}
    </div>
  );
}
