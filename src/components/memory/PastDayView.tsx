"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { fetchDayMoments } from "@/lib/supabase/moments";
import type { JournalMoment } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";
import AudioMoment from "@/components/memory/AudioMoment";

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

// ── Grouping ──────────────────────────────────────────────────────────────────

type MomentRender =
  | { kind: "single"; moment: JournalMoment }
  | { kind: "cluster"; pair: [JournalMoment, JournalMoment] };

function groupMoments(moments: JournalMoment[], heroId: string | undefined): MomentRender[] {
  const result: MomentRender[] = [];
  let i = 0;
  while (i < moments.length) {
    const m = moments[i];
    const isNonHero = m.type === "photo" && m.id !== heroId;
    const next      = moments[i + 1];
    const nextIsNonHero = next?.type === "photo" && next.id !== heroId;
    if (isNonHero && nextIsNonHero) {
      result.push({ kind: "cluster", pair: [m, next] });
      i += 2;
    } else {
      result.push({ kind: "single", moment: m });
      i++;
    }
  }
  return result;
}

// ── TapeStrip ─────────────────────────────────────────────────────────────────

function TapeStrip({ id }: { id: string }) {
  const n    = stableN(id);
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

// ── HeroPhoto — cinematic full-bleed opener ───────────────────────────────────

function HeroPhoto({ moment }: { moment: JournalMoment }) {
  const ctx = CAT_CTX[moment.category] ?? "";
  return (
    <>
      <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "3/4", minHeight: 360 }}>
        {moment.imageUrl && (
          <Image
            src={moment.imageUrl}
            alt={moment.content}
            fill priority
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2.5">
            {moment.time}{ctx ? ` · ${ctx}` : ""}
          </p>
          <p className="text-[20px] font-bold text-white leading-snug tracking-tight mb-3">
            {moment.content}
          </p>
          {moment.createdBy && (
            <AuthorBadge author={moment.createdBy} time={moment.time} light />
          )}
        </div>
      </div>
      <div className="px-7 pt-5 pb-2 mb-4 space-y-4">
        <ReactionBar initialReactions={moment.reactions} momentId={moment.id} />
        <ReplyThread initialReplies={moment.replies} momentId={moment.id} />
      </div>
    </>
  );
}

// ── PolaroidPhoto ─────────────────────────────────────────────────────────────

function PolaroidPhoto({ moment }: { moment: JournalMoment }) {
  const rot    = idRotation(moment.id);
  const n      = stableN(moment.id);
  const isLeft = n % 2 === 0;
  const aspect = photoAspect(moment.id);
  const ctx    = CAT_CTX[moment.category] ?? "";

  return (
    <div
      className="py-3"
      style={{
        paddingLeft:  isLeft ? "16px" : "46px",
        paddingRight: isLeft ? "46px" : "16px",
      }}
    >
      <div className="relative mt-4">
        <TapeStrip id={moment.id} />
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-[3px] pt-3 px-3 pb-4"
          style={{
            background: "#fff",
            rotate: rot,
            boxShadow: "0 4px 20px rgba(0,0,0,0.11), 0 1px 3px rgba(0,0,0,0.05)",
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
                sizes="(max-width: 448px) 80vw, 360px"
              />
            )}
          </div>
          <div className="mt-2.5 px-0.5">
            <p className="text-[11px] font-medium leading-snug text-stone-700">{moment.content}</p>
            {moment.createdBy && (
              <div className="mt-1.5 opacity-50">
                <AuthorBadge author={moment.createdBy} time={moment.time} showRole={false} />
                {ctx && (
                  <p className="text-[9px] text-stone-400 italic mt-0.5 pl-8">{ctx}</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-100/70">
            <ReactionBar initialReactions={moment.reactions} momentId={moment.id} />
          </div>
        </motion.div>
      </div>
      <div className="mt-3">
        <ReplyThread initialReplies={moment.replies} momentId={moment.id} />
      </div>
    </div>
  );
}

// ── PhotoClusterPair ──────────────────────────────────────────────────────────

function PhotoClusterPair({ pair }: { pair: [JournalMoment, JournalMoment] }) {
  const [left, right] = pair;
  const leftRot  = idRotation(left.id, 0.9);
  const rightRot = idRotation(right.id, 0.9);
  const rightMt  = 16 + (stableN(right.id) % 3) * 10;

  return (
    <>
    <div className="flex items-start gap-2.5 px-3 py-5">
      <div className="flex-1 relative mt-5">
        <TapeStrip id={left.id} />
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-[3px] pt-2.5 px-2.5 pb-8"
          style={{
            background: "#fff",
            rotate: leftRot,
            boxShadow: "0 4px 20px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="w-full rounded-[2px] overflow-hidden bg-muted relative" style={{ aspectRatio: "3/4" }}>
            {left.imageUrl && (
              <Image src={left.imageUrl} alt={left.content} fill className="object-cover" sizes="45vw" />
            )}
          </div>
          <p className="text-[9px] text-stone-700 font-medium mt-2 leading-snug line-clamp-2">{left.content}</p>
          {left.createdBy && (
            <div className="mt-1 opacity-40">
              <AuthorBadge author={left.createdBy} showRole={false} />
            </div>
          )}
        </motion.div>
      </div>

      <div className="flex-1 relative" style={{ marginTop: rightMt }}>
        <TapeStrip id={right.id} />
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-[3px] pt-2.5 px-2.5 pb-8"
          style={{
            background: "#fff",
            rotate: rightRot,
            boxShadow: "0 4px 20px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="w-full rounded-[2px] overflow-hidden bg-muted relative" style={{ aspectRatio: "1/1" }}>
            {right.imageUrl && (
              <Image src={right.imageUrl} alt={right.content} fill className="object-cover" sizes="45vw" />
            )}
          </div>
          <p className="text-[9px] text-stone-700 font-medium mt-2 leading-snug line-clamp-2">{right.content}</p>
          {right.createdBy && (
            <div className="mt-1 opacity-40">
              <AuthorBadge author={right.createdBy} showRole={false} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
    <div className="px-5 pb-3 -mt-1">
      <ReactionBar />
    </div>
    </>
  );
}

// ── MilestoneMoment ───────────────────────────────────────────────────────────

function MilestoneMoment({ moment }: { moment: JournalMoment }) {
  return (
    <div className="px-8 py-12 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 45% at 50% 25%, rgba(251,191,36,0.06) 0%, transparent 70%)",
        }}
      />
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="text-[11px] text-amber-300/55 select-none">✦</span>
        <span className="text-[28px] text-amber-400 dark:text-amber-500 leading-none select-none">✦</span>
        <span className="text-[11px] text-amber-300/55 select-none">✦</span>
      </div>
      <p className="text-[26px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-[260px] mx-auto">
        {moment.content}
      </p>
      {moment.createdBy && (
        <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center mb-6" />
      )}
      <div className="flex flex-col items-center gap-4 max-w-[300px] mx-auto">
        <ReactionBar initialReactions={moment.reactions} momentId={moment.id} className="justify-center" />
        <ReplyThread initialReplies={moment.replies} momentId={moment.id} className="w-full text-left" />
      </div>
    </div>
  );
}

// ── NoteMoment ────────────────────────────────────────────────────────────────

function NoteMoment({ moment }: { moment: JournalMoment }) {
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
          {moment.createdBy && (
            <div className="mb-5">
              <AuthorBadge author={moment.createdBy} time={moment.time} />
              {ctx && (
                <p className="text-[10px] text-muted-foreground/40 italic mt-1 ml-8">{ctx}</p>
              )}
            </div>
          )}
          <div className="space-y-4">
            <ReactionBar initialReactions={moment.reactions} momentId={moment.id} />
            <ReplyThread initialReplies={moment.replies} momentId={moment.id} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── PastDayView ───────────────────────────────────────────────────────────────

interface Props {
  date: string;
}

export default function PastDayView({ date }: Props) {
  const [moments, setMoments] = useState<JournalMoment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setMoments([]);
    fetchDayMoments(date).then((result) => {
      setMoments(result);
      setLoading(false);
    });
  }, [date]);

  if (loading) {
    return (
      <div className="pb-8 space-y-4 pt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="mx-4 h-24 rounded-2xl bg-muted/50 animate-pulse"
            style={{ opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>
    );
  }

  if (moments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
        <p className="text-[36px] mb-3 select-none leading-none">📅</p>
        <p className="text-[15px] font-semibold text-foreground/55 mb-1.5">Nothing here yet</p>
        <p className="text-[13px] text-muted-foreground/40 leading-snug max-w-[210px]">
          No moments were logged for {date}
        </p>
      </div>
    );
  }

  const firstPhotoId = moments.find((m) => m.type === "photo")?.id;
  const grouped = groupMoments(moments, firstPhotoId);

  return (
    <div className="pb-8">
      {grouped.map((render, i) => (
        <motion.div
          key={render.kind === "cluster" ? `cluster-${render.pair[0].id}` : render.moment.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          {render.kind === "cluster" && <PhotoClusterPair pair={render.pair} />}
          {render.kind === "single" && render.moment.type === "photo" && render.moment.id === firstPhotoId && (
            <HeroPhoto moment={render.moment} />
          )}
          {render.kind === "single" && render.moment.type === "photo" && render.moment.id !== firstPhotoId && (
            <PolaroidPhoto moment={render.moment} />
          )}
          {render.kind === "single" && render.moment.type === "milestone" && (
            <MilestoneMoment moment={render.moment} />
          )}
          {render.kind === "single" && render.moment.type === "note" && (
            <NoteMoment moment={render.moment} />
          )}
          {render.kind === "single" && render.moment.type === "audio" && (
            <AudioMoment moment={render.moment} />
          )}
        </motion.div>
      ))}
    </div>
  );
}
