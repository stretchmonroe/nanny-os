"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";
import type { JournalMoment } from "@/lib/data/demo";

type Highlight = { momentIndex: number; caption: string };

interface Props {
  moments: JournalMoment[];
}

export default function MemoryHighlight({ moments }: Props) {
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const { activeChild } = useAppStore();

  const displayMoments = moments.filter((m) => m.type !== "audio");

  useEffect(() => {
    if (displayMoments.length === 0) return;
    setHighlight(null);
    callAI("memoryHighlight", {
      childName: activeChild.name,
      childAge:  activeChild.age,
      moments:   displayMoments.map((m) => m.content),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<Highlight>(res.result, { momentIndex: 0, caption: "" });
      if (typeof parsed.momentIndex === "number" && parsed.caption) {
        setHighlight(parsed);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moments]);

  if (displayMoments.length === 0 || !highlight) return null;

  const moment = displayMoments[highlight.momentIndex] ?? displayMoments[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="mx-4 rounded-[1.75rem] overflow-hidden"
      style={{
        background: "var(--surface-card)",
        border: "1.5px solid var(--border-soft)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="px-6 pt-5 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-amber-400/70 text-[11px] select-none leading-none">✦</span>
          <span className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest">
            Moment of the week
          </span>
        </div>

        <p
          className="text-[56px] leading-[0.6] mb-3 select-none font-serif"
          style={{ color: "rgba(251,191,36,0.35)" }}
        >
          &ldquo;
        </p>

        <AnimatePresence mode="wait">
          <motion.p
            key={moment?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[15px] font-semibold text-foreground/80 leading-snug italic mb-5"
          >
            {moment?.content}
          </motion.p>
        </AnimatePresence>

        <div
          className="h-[1px] mb-5"
          style={{
            background: "linear-gradient(to right, var(--border-soft) 0%, transparent 70%)",
          }}
        />

        <AnimatePresence mode="wait">
          <motion.p
            key={highlight.caption}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-[13px] text-foreground/50 leading-[1.72]"
          >
            {highlight.caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
