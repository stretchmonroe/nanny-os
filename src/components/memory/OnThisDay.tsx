"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { weeklyMoments } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";

type OTD = { reflection: string };

// Use the May 7 entry (one week before today, May 14)
const PAST_DAY_INDEX = weeklyMoments.length - 1;
const pastDay = weeklyMoments[PAST_DAY_INDEX];
const pastMoment = pastDay?.moments.find(m => m.type === "note" || m.type === "milestone") ?? pastDay?.moments[0];
const DAYS_AGO: number = 6;

const demo: OTD = {
  reflection: "Six days before saying 'more', he was showing you his focus in a different way — 18 minutes in a sensory bin, completely absorbed. That same intensity is still there, just finding new places to go.",
};

export default function OnThisDay() {
  const [data, setData] = useState<OTD>(demo);
  const { activeChild } = useAppStore();

  useEffect(() => {
    if (!pastMoment) return;

    const todayMilestone = weeklyMoments[0]?.moments
      .find(m => m.type === "milestone")?.content;

    callAI("onThisDay", {
      childName: activeChild.name,
      childAge: activeChild.age,
      pastMoment: pastMoment.content,
      daysAgo: DAYS_AGO,
      presentMoment: todayMilestone,
    }).then(res => {
      if (!res) return;
      const parsed = parseAIJson<OTD>(res.result, demo);
      if (parsed.reflection) setData(parsed);
    });
  }, []);

  if (!pastMoment) return null;

  const dayLabel = `${DAYS_AGO === 7 ? "One week" : `${DAYS_AGO} days`} ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="mx-4 rounded-[1.4rem] overflow-hidden"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-soft)",
      }}
    >
      <div className="flex items-start gap-4 px-4 pt-4 pb-4">
        {/* Thumbnail */}
        {pastMoment.imageUrl ? (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <Image
              src={pastMoment.imageUrl}
              alt={pastMoment.content}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-[22px]"
            style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)" }}
          >
            {pastMoment.type === "milestone" ? "⭐" : "📝"}
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Date chip */}
          <span
            className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 select-none"
            style={{
              background: "rgba(251,191,36,0.15)",
              color: "rgba(161,117,40,0.85)",
            }}
          >
            {dayLabel}
          </span>

          {/* Moment */}
          <p className="text-[13px] font-medium text-foreground/75 leading-snug line-clamp-2 mb-2">
            {pastMoment.content}
          </p>

          {/* AI reflection */}
          <AnimatePresence mode="wait">
            <motion.p
              key={data.reflection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[12px] text-muted-foreground/50 leading-snug italic"
            >
              {data.reflection}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
