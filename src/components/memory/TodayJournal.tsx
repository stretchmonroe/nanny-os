"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";

const today = weeklyMoments[0];

/** Small heart button for photo overlays */
function PhotoHeart() {
  const [liked, setLiked] = useState(false);
  const [popped, setPopped] = useState(false);

  function tap() {
    if (!liked) {
      setPopped(true);
      setTimeout(() => setPopped(false), 600);
    }
    setLiked((v) => !v);
  }

  return (
    <motion.button
      onClick={tap}
      animate={popped ? { scale: [1, 1.5, 0.85, 1.1, 1] } : { scale: 1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={liked ? "filled" : "empty"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[16px] leading-none"
        >
          {liked ? "❤️" : "🤍"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

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

      {/* Heart button — top right */}
      <div className="absolute top-4 right-4">
        <PhotoHeart />
      </div>

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

        {/* Heart button — top right */}
        <div className="absolute top-3.5 right-3.5">
          <PhotoHeart />
        </div>

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
      <div className="text-[42px] text-amber-400 dark:text-amber-500 mb-5 leading-none select-none">✦</div>
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

      {/* Interactions */}
      <div className="flex flex-col items-center gap-4 max-w-[300px] mx-auto">
        <ReactionBar initialReactions={moment.reactions} className="justify-center" />
        <ReplyThread initialReplies={moment.replies} className="w-full text-left" />
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

      {/* Interactions */}
      <div className="space-y-4">
        <ReactionBar initialReactions={moment.reactions} />
        <ReplyThread initialReplies={moment.replies} />
      </div>
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
