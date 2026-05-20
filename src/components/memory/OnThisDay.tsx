"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { fetchOnThisDayMoment } from "@/lib/supabase/moments";
import type { OnThisDayResult } from "@/lib/supabase/moments";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";

type OTD = { reflection: string };

export default function OnThisDay() {
  const [result,     setResult]     = useState<OnThisDayResult | null>(null);
  const [reflection, setReflection] = useState<string>("");
  const [loaded,     setLoaded]     = useState(false);
  const { activeChild } = useAppStore();

  useEffect(() => {
    fetchOnThisDayMoment().then((r) => {
      setResult(r);
      setLoaded(true);
    });
  }, [activeChild.id]);

  useEffect(() => {
    if (!result) return;

    callAI("onThisDay", {
      childName:     activeChild.name,
      childAge:      activeChild.age,
      pastMoment:    result.moment.content,
      daysAgo:       result.daysAgo,
      presentMoment: undefined,
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<OTD>(res.result, { reflection: "" });
      if (parsed.reflection) setReflection(parsed.reflection);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Don't render until we know whether there's data
  if (!loaded || !result) return null;

  const { moment, daysAgo } = result;
  const dayLabel = daysAgo === 7
    ? "One week ago"
    : daysAgo === 365
    ? "One year ago"
    : `${daysAgo} days ago`;

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
        {moment.imageUrl ? (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
            <Image
              src={moment.imageUrl}
              alt={moment.content}
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
            {moment.type === "milestone" ? "⭐" : "📝"}
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <span
            className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 select-none"
            style={{
              background: "rgba(251,191,36,0.15)",
              color: "rgba(161,117,40,0.85)",
            }}
          >
            {dayLabel}
          </span>

          <p className="text-[13px] font-medium text-foreground/75 leading-snug line-clamp-2 mb-2">
            {moment.content}
          </p>

          <AnimatePresence mode="wait">
            {reflection && (
              <motion.p
                key={reflection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[12px] text-muted-foreground/50 leading-snug italic"
              >
                {reflection}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
