"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { recentMemories, dailySummaries } from "@/lib/data/demo";
import type { DailySummary } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";

function SummaryBanner({ summary }: { summary: DailySummary }) {
  return (
    <div className="mx-4 mb-6 rounded-[1.5rem] bg-stone-900 dark:bg-stone-950 overflow-hidden">
      <div className="px-6 pt-7 pb-7">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">
          {summary.dateLabel}
        </p>
        <h2 className="text-[22px] font-extrabold text-white leading-tight mb-3">
          {summary.headline}
        </h2>
        <p className="text-[14px] text-white/55 leading-[1.65]">{summary.summary}</p>
        {summary.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {summary.highlights.map((h) => (
              <span
                key={h}
                className="text-[12px] text-white/60 bg-white/8 px-3 py-1.5 rounded-full border border-white/10"
              >
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  date: string;
}

export default function PastDayView({ date }: Props) {
  const memories = recentMemories.filter((m) => m.date === date);

  const MONTH_MAP: Record<string, string> = {
    January:"01", February:"02", March:"03", April:"04", May:"05", June:"06",
    July:"07", August:"08", September:"09", October:"10", November:"11", December:"12",
  };
  const parts = date.match(/^([A-Za-z]+)\s+(\d+)$/);
  const isoDate = parts
    ? `2026-${MONTH_MAP[parts[1]] ?? "00"}-${parts[2].padStart(2, "0")}`
    : "";
  const summary = dailySummaries.find((s) => s.date === isoDate);

  const firstPhotoId = memories.find((m) => m.type === "photo")?.id;

  if (memories.length === 0) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-[15px] text-muted-foreground">No memories for this day.</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {summary && <SummaryBanner summary={summary} />}

      {memories.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        >
          {m.type === "photo" && m.id === firstPhotoId && (
            <div
              className="relative w-full overflow-hidden bg-muted mb-4"
              style={{ aspectRatio: "3/4" }}
            >
              {m.imageUrl && (
                <Image
                  src={m.imageUrl}
                  alt={m.content}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
                <p className="text-[20px] font-bold text-white leading-snug tracking-tight mb-3">
                  {m.content}
                </p>
                <AuthorBadge author={m.createdBy} time={m.time} light />
              </div>
            </div>
          )}

          {m.type === "photo" && m.id !== firstPhotoId && (
            <div className="px-5 py-4">
              <div
                className="relative w-full rounded-[1.5rem] overflow-hidden bg-muted shadow-elevated"
                style={{ aspectRatio: "4/3" }}
              >
                {m.imageUrl && (
                  <Image
                    src={m.imageUrl}
                    alt={m.content}
                    fill
                    className="object-cover"
                    sizes="(max-width: 416px) 100vw, 416px"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[16px] font-bold text-white leading-snug tracking-tight mb-2.5">
                    {m.content}
                  </p>
                  <AuthorBadge author={m.createdBy} time={m.time} light />
                </div>
              </div>
            </div>
          )}

          {m.type === "milestone" && (
            <div className="px-8 py-12 text-center">
              <div className="text-[42px] text-amber-400 dark:text-amber-500 mb-5 leading-none select-none">
                ✦
              </div>
              <p className="text-[26px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-[260px] mx-auto">
                {m.content}
              </p>
              <AuthorBadge author={m.createdBy} time={m.time} className="justify-center mb-6" />
              <ReactionBar className="justify-center" />
            </div>
          )}

          {m.type === "note" && (
            <div className="px-8 py-8">
              <p className="text-[64px] leading-[0.65] text-amber-300 dark:text-amber-700 font-serif mb-4 select-none">
                &ldquo;
              </p>
              <p className="text-[18px] font-medium text-foreground leading-[1.7] mb-4">
                {m.content}
              </p>
              <AuthorBadge author={m.createdBy} time={m.time} className="mb-5" />
              <div className="space-y-4">
                <ReactionBar />
                <ReplyThread />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
