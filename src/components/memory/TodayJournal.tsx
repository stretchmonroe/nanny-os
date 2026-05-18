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

// ── Helpers ───────────────────────────────────────────────────────────────────

function stableN(id: string) {
  return id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
}

function idRotation(id: string, scale = 1): number {
  const rots = [-2.5, 1.4, -1.1, 2.7, -1.7, 1.3];
  return rots[stableN(id) % rots.length] * scale;
}

const PHOTO_ASPECTS = ["3/4", "4/3", "1/1"] as const;
function photoAspect(id: string): string {
  return PHOTO_ASPECTS[stableN(id) % PHOTO_ASPECTS.length];
}

const CAT_CTX: Record<string, string> = {
  outdoor:  "at the park",
  play:     "during play",
  meal:     "at mealtime",
  learning: "during learning time",
  nap:      "before rest",
};

// ── TapeStrip ─────────────────────────────────────────────────────────────────

function TapeStrip({ id }: { id: string }) {
  const n = stableN(id);
  const rot  = [-3, 2, -1.5, 3.5, -2.2, 1.8][(n + 1) % 6];
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

// ── PhotoHeart ────────────────────────────────────────────────────────────────

function PhotoHeart({ size = "md" }: { size?: "sm" | "md" }) {
  const [liked, setLiked] = useState(false);
  const [popped, setPopped] = useState(false);

  function tap() {
    if (!liked) { setPopped(true); setTimeout(() => setPopped(false), 600); }
    setLiked((v) => !v);
  }

  return (
    <motion.button
      onClick={tap}
      animate={popped ? { scale: [1, 1.5, 0.85, 1.1, 1] } : { scale: 1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className={
        size === "sm"
          ? "w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
          : "w-8 h-8 rounded-full bg-black/22 backdrop-blur-sm flex items-center justify-center"
      }
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={liked ? "filled" : "empty"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={size === "sm" ? "text-[11px] leading-none" : "text-[14px] leading-none"}
        >
          {liked ? "❤️" : "🤍"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ── HeroPhoto — cinematic day opener ─────────────────────────────────────────

function HeroPhoto({ moment }: { moment: JournalMoment }) {
  const ctx = CAT_CTX[moment.category] ?? "";
  return (
    <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "3/4", minHeight: 380 }}>
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill priority
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      {/* Rich gradient — dark at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      <div className="absolute top-4 right-4"><PhotoHeart /></div>

      <div className="absolute bottom-0 left-0 right-0 px-7 pb-10">
        {/* Time + context stamp */}
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2.5">
          {moment.time}{ctx ? ` · ${ctx}` : ""}
        </p>
        {/* Headline */}
        <p className="text-[22px] font-extrabold text-white leading-snug tracking-tight mb-3.5">
          {moment.content}
        </p>
        {moment.createdBy && (
          <AuthorBadge author={moment.createdBy} light showRole={false} />
        )}
      </div>
    </div>
  );
}

// ── PolaroidPhoto — variable aspect, scrapbook ────────────────────────────────

function PolaroidPhoto({ moment, isWide }: { moment: JournalMoment; isWide: boolean }) {
  const rot  = idRotation(moment.id);
  const n    = stableN(moment.id);
  const isLeft = n % 2 === 0;
  const aspect = isWide ? "4/3" : photoAspect(moment.id);
  const ctx    = CAT_CTX[moment.category] ?? "";

  return (
    <div
      className="py-4"
      style={{
        paddingLeft:  isLeft ? "18px" : "44px",
        paddingRight: isLeft ? "44px" : "18px",
      }}
    >
      <motion.div
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.97 }}
        className="relative mt-4"
        style={{ rotate: rot }}
      >
        <TapeStrip id={moment.id} />
        <div
          className="rounded-[3px] pt-3 px-3 pb-9"
          style={{
            background: "#fff",
            boxShadow: "0 6px 32px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="w-full rounded-[2px] overflow-hidden bg-muted relative"
            style={{ aspectRatio: aspect }}
          >
            {moment.imageUrl && (
              <Image
                src={moment.imageUrl}
                alt={moment.content}
                fill
                className="object-cover"
                sizes="(max-width: 400px) 90vw, 400px"
              />
            )}
            <div className="absolute top-2 right-2"><PhotoHeart size="sm" /></div>
          </div>
          <div className="mt-3 px-0.5">
            <p className="text-[12px] text-stone-700 font-medium leading-snug">
              {moment.content}
            </p>
            {moment.createdBy && (
              <div className="mt-2 opacity-55">
                <AuthorBadge author={moment.createdBy} time={moment.time} showRole={false} />
                {ctx && (
                  <p className="text-[9px] text-stone-400 italic mt-0.5 pl-8">{ctx}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── NoteCard — handwritten diary ──────────────────────────────────────────────

function NoteCard({ moment }: { moment: JournalMoment }) {
  const rot = idRotation(moment.id, 0.45);
  const ctx = CAT_CTX[moment.category] ?? "";

  return (
    <div className="px-5 py-5">
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        style={{ rotate: rot }}
      >
        <div
          className="rounded-[1.75rem] px-7 pt-7 pb-7"
          style={{
            background: "var(--surface-card)",
            border: "1.5px solid var(--border-soft)",
            boxShadow: "0 4px 28px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <p className="text-[54px] leading-[0.68] text-amber-300 dark:text-amber-700 font-serif mb-3 select-none">
            &ldquo;
          </p>
          <p className="text-[18px] font-medium text-foreground leading-[1.7] mb-5">
            {moment.content}
          </p>
          {moment.createdBy ? (
            <div className="mb-5">
              <AuthorBadge author={moment.createdBy} time={moment.time} />
              {ctx && (
                <p className="text-[10px] text-muted-foreground/40 italic mt-1 ml-8">{ctx}</p>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground font-semibold mb-5">{moment.time}</p>
          )}
          <div className="space-y-4">
            <ReactionBar initialReactions={moment.reactions} />
            <ReplyThread initialReplies={moment.replies} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── MilestonePanel — editorial centrepiece ────────────────────────────────────

function MilestonePanel({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-6 py-14 text-center relative overflow-hidden">
      {/* Ambient amber wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(251,191,36,0.07) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 260 }}
      >
        <div className="flex items-center justify-center gap-3 mb-7">
          <motion.span
            className="text-[12px] text-amber-300/55 select-none"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            ✦
          </motion.span>
          <motion.span
            className="text-[30px] text-amber-400 dark:text-amber-500 leading-none select-none"
            animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            ✦
          </motion.span>
          <motion.span
            className="text-[12px] text-amber-300/55 select-none"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            ✦
          </motion.span>
        </div>
        <p className="text-[30px] font-extrabold text-foreground leading-snug tracking-tight mb-5 max-w-[270px] mx-auto">
          {moment.content}
        </p>
        {moment.createdBy ? (
          <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center mb-6" />
        ) : (
          <p className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-widest mb-6">
            {moment.time}
          </p>
        )}
        <div className="flex flex-col items-center gap-4 max-w-[300px] mx-auto">
          <ReactionBar initialReactions={moment.reactions} className="justify-center" />
          <ReplyThread initialReplies={moment.replies} className="w-full text-left" />
        </div>
      </motion.div>
    </div>
  );
}

// ── TodayJournal ──────────────────────────────────────────────────────────────

export default function TodayJournal() {
  const firstPhotoId = today.moments.find((m) => m.type === "photo")?.id;

  const photoIndexMap: Record<string, number> = {};
  let pi = 0;
  for (const m of today.moments) {
    if (m.type === "photo" && m.id !== firstPhotoId) {
      photoIndexMap[m.id] = pi++;
    }
  }

  // Entrance delays: hero immediate, rest staggered
  const delayFor = (i: number, type: string) =>
    type === "photo" && i === 0 ? 0 : 0.05 + i * 0.08;

  return (
    <div className="pb-8">
      {today.moments.map((moment, i) => {
        const isHero   = moment.type === "photo" && moment.id === firstPhotoId;
        const photoIdx = photoIndexMap[moment.id] ?? 0;

        return (
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, y: isHero ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay:    delayFor(i, moment.type),
              duration: isHero ? 0.4 : 0.65,
              ease:     [0.25, 1, 0.5, 1],
            }}
          >
            {isHero && <HeroPhoto moment={moment} />}
            {moment.type === "photo" && !isHero && (
              <PolaroidPhoto moment={moment} isWide={photoIdx % 2 === 1} />
            )}
            {moment.type === "milestone" && <MilestonePanel moment={moment} />}
            {moment.type === "note"      && <NoteCard moment={moment} />}
          </motion.div>
        );
      })}
    </div>
  );
}
