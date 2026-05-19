"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { recentMemories } from "@/lib/data/demo";
import type { MemoryEvent } from "@/lib/data/demo";
import { cn } from "@/lib/utils";
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

const DAY_NAMES: Record<string, string> = {
  "May 14": "Thursday", "May 13": "Wednesday", "May 12": "Tuesday",
  "May 11": "Monday",   "May 10": "Sunday",    "May 9":  "Saturday",
  "May 8":  "Friday",   "May 7":  "Thursday",  "May 6":  "Wednesday",
  "May 5":  "Tuesday",  "May 4":  "Monday",    "May 3":  "Sunday",
  "May 2":  "Saturday", "May 1":  "Friday",
};

// ── Grouping ──────────────────────────────────────────────────────────────────

type MomentRender =
  | { kind: "single"; moment: MemoryEvent }
  | { kind: "cluster"; pair: [MemoryEvent, MemoryEvent] };

function groupMoments(moments: MemoryEvent[], heroId: string | undefined): MomentRender[] {
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

// ── PageDivider ───────────────────────────────────────────────────────────────

function PageDivider() {
  return (
    <div className="flex items-center gap-4 px-8 py-3">
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to right, transparent, var(--border-soft), transparent)" }}
      />
      <span className="text-amber-300/35 text-[9px] select-none shrink-0">✦ · ✦</span>
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to left, transparent, var(--border-soft), transparent)" }}
      />
    </div>
  );
}

// ── DayHeroPhoto ─────────────────────────────────────────────────────────────

function DayHeroPhoto({ moment }: { moment: MemoryEvent }) {
  const ctx = CAT_CTX[moment.category] ?? "";
  return (
    <>
      <motion.div
        whileTap={{ scale: 0.99 }}
        className="relative overflow-hidden bg-muted mx-4 rounded-2xl"
        style={{ aspectRatio: "4/3" }}
      >
        {moment.imageUrl && (
          <Image
            src={moment.imageUrl}
            alt={moment.content}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 90vw, 400px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/22 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
            {moment.time}{ctx ? ` · ${ctx}` : ""}
          </p>
          <p className="text-[17px] font-bold text-white leading-snug tracking-tight mb-2.5">
            {moment.content}
          </p>
          <AuthorBadge author={moment.createdBy} time={moment.time} light showRole={false} />
        </div>
      </motion.div>
      <div className="px-6 pt-4 pb-2 space-y-4">
        <ReactionBar />
        <ReplyThread />
      </div>
    </>
  );
}

// ── PolaroidPhoto ─────────────────────────────────────────────────────────────

function PolaroidPhoto({ moment }: { moment: MemoryEvent }) {
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
            <div className="mt-1.5 opacity-50">
              <AuthorBadge author={moment.createdBy} time={moment.time} showRole={false} />
              {ctx && (
                <p className="text-[9px] text-stone-400 italic mt-0.5 pl-8">{ctx}</p>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-stone-100/70">
            <ReactionBar />
          </div>
        </motion.div>
      </div>
      <div className="mt-3">
        <ReplyThread />
      </div>
    </div>
  );
}

// ── PhotoClusterPair ──────────────────────────────────────────────────────────

function PhotoClusterPair({ pair }: { pair: [MemoryEvent, MemoryEvent] }) {
  const [left, right] = pair;
  const leftRot  = idRotation(left.id, 0.9);
  const rightRot = idRotation(right.id, 0.9);
  const rightMt  = 16 + (stableN(right.id) % 3) * 10;

  return (
    <>
    <div className="flex items-start gap-2.5 px-3 py-4">
      <div className="flex-1 relative mt-5">
        <TapeStrip id={left.id} />
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-[3px] pt-2.5 px-2.5 pb-7"
          style={{
            background: "#fff",
            rotate: leftRot,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="w-full rounded-[2px] overflow-hidden bg-muted relative" style={{ aspectRatio: "3/4" }}>
            {left.imageUrl && (
              <Image src={left.imageUrl} alt={left.content} fill className="object-cover" sizes="45vw" />
            )}
          </div>
          <p className="text-[9px] text-stone-700 font-medium mt-2 leading-snug line-clamp-2">{left.content}</p>
          <div className="mt-1 opacity-40">
            <AuthorBadge author={left.createdBy} showRole={false} />
          </div>
        </motion.div>
      </div>

      <div className="flex-1 relative" style={{ marginTop: rightMt }}>
        <TapeStrip id={right.id} />
        <motion.div
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-[3px] pt-2.5 px-2.5 pb-7"
          style={{
            background: "#fff",
            rotate: rightRot,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div className="w-full rounded-[2px] overflow-hidden bg-muted relative" style={{ aspectRatio: "1/1" }}>
            {right.imageUrl && (
              <Image src={right.imageUrl} alt={right.content} fill className="object-cover" sizes="45vw" />
            )}
          </div>
          <p className="text-[9px] text-stone-700 font-medium mt-2 leading-snug line-clamp-2">{right.content}</p>
          <div className="mt-1 opacity-40">
            <AuthorBadge author={right.createdBy} showRole={false} />
          </div>
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

function MilestoneMoment({ moment }: { moment: MemoryEvent }) {
  return (
    <div className="px-7 py-12 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 45% at 50% 25%, rgba(251,191,36,0.06) 0%, transparent 70%)",
        }}
      />
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="text-[11px] text-amber-300/55 select-none">✦</span>
        <span className="text-[26px] text-amber-400 dark:text-amber-500 leading-none select-none">✦</span>
        <span className="text-[11px] text-amber-300/55 select-none">✦</span>
      </div>
      <p className="text-[24px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-xs mx-auto">
        {moment.content}
      </p>
      <AuthorBadge author={moment.createdBy} time={moment.time} className="justify-center mb-5" />
      <div className="flex flex-col items-center gap-4 max-w-[300px] mx-auto">
        <ReactionBar className="justify-center" />
        <ReplyThread className="w-full text-left" />
      </div>
    </div>
  );
}

// ── NoteMoment ────────────────────────────────────────────────────────────────

function NoteMoment({ moment }: { moment: MemoryEvent }) {
  const rot = idRotation(moment.id, 0.4);
  const ctx = CAT_CTX[moment.category] ?? "";
  return (
    <div className="px-5 py-4">
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        style={{ rotate: rot }}
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
          <div className="mb-4">
            <AuthorBadge author={moment.createdBy} time={moment.time} />
            {ctx && (
              <p className="text-[10px] text-muted-foreground/40 italic mt-0.5 ml-8">{ctx}</p>
            )}
          </div>
          <div className="space-y-3">
            <ReactionBar />
            <ReplyThread />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── PastWeekView ──────────────────────────────────────────────────────────────

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

      <div className="space-y-10">
        {grouped.map((dayData, dayIndex) => {
          const firstPhotoId = dayData.moments.find((m) => m.type === "photo")?.id;
          const renders      = groupMoments(dayData.moments, firstPhotoId);
          const dayParts     = dayData.date.split(" ");
          const dayNum       = dayParts[dayParts.length - 1];

          return (
            <motion.div
              key={dayData.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.06, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            >
              {dayIndex > 0 && <PageDivider />}

              {/* Day header */}
              <div className={cn("flex items-end justify-between mb-4 px-5", dayIndex > 0 && "mt-2")}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-muted-foreground/45">
                    {dayData.dayName}
                  </p>
                  <p className="text-[48px] font-black text-foreground tracking-tight leading-none">
                    {dayNum}
                  </p>
                  <p className="text-[11px] text-muted-foreground/35 font-medium mt-0.5">
                    {dayData.date} · {dayData.moments.length} moment{dayData.moments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Moments */}
              <div>
                {renders.map((render) => {
                  if (render.kind === "cluster") {
                    return (
                      <PhotoClusterPair
                        key={`cluster-${render.pair[0].id}`}
                        pair={render.pair}
                      />
                    );
                  }
                  const { moment } = render;
                  const isHero = moment.type === "photo" && moment.id === firstPhotoId;
                  return (
                    <div key={moment.id}>
                      {isHero                              && <DayHeroPhoto moment={moment} />}
                      {moment.type === "photo" && !isHero  && <PolaroidPhoto moment={moment} />}
                      {moment.type === "milestone"          && <MilestoneMoment moment={moment} />}
                      {moment.type === "note"               && <NoteMoment moment={moment} />}
                      {moment.type === "audio"              && <AudioMoment moment={moment} />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
