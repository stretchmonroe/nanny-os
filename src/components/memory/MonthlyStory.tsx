"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { weeklyMoments, favoriteMemories } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";
import AuthorBadge from "@/components/ui/AuthorBadge";

type MonthStory = { title: string; story: string };

const demo: MonthStory = {
  title: "The month he started talking back",
  story: "May has been the month Mateo started talking back to the world. Not with sentences, or even complete words yet — but with intention. A wave to the mailman. A word for more. A staircase climbed alone, and at the top a pause that said everything. Each small act is the same story told differently: he's finding out what he can do, and he likes what he finds.",
};

export default function MonthlyStory() {
  const [story, setStory] = useState<MonthStory>(demo);
  const { activeChild } = useAppStore();

  useEffect(() => {
    const weekHighlights = weeklyMoments
      .flatMap(d => d.moments)
      .filter(m => m.type === "milestone")
      .map(m => m.content)
      .slice(0, 6);

    const favHighlights = favoriteMemories
      .slice(0, 3)
      .map(f => f.content);

    callAI("monthlyStory", {
      childName: activeChild.name,
      childAge: activeChild.age,
      month: "May 2026",
      highlights: [...weekHighlights, ...favHighlights],
    }).then(res => {
      if (!res) return;
      const parsed = parseAIJson<MonthStory>(res.result, demo);
      if (parsed.title && parsed.story) setStory(parsed);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
      className="mx-5 mb-8 rounded-[1.75rem] overflow-hidden"
      style={{
        background: "linear-gradient(158deg, #FAF6EF 0%, var(--surface-card) 100%)",
        border: "1.5px solid var(--border-soft)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <div className="px-6 pt-6 pb-7">
        {/* Month label */}
        <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mb-4 select-none">
          May 2026
        </p>

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={story.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[24px] font-extrabold text-foreground tracking-tight leading-snug mb-5"
          >
            {story.title}
          </motion.h2>
        </AnimatePresence>

        {/* Thin rule */}
        <div
          className="h-[1px] mb-5"
          style={{
            background: "linear-gradient(to right, var(--border-medium) 0%, transparent 80%)",
          }}
        />

        {/* Narrative */}
        <AnimatePresence mode="wait">
          <motion.p
            key={story.story}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.04 }}
            className="text-[14px] text-foreground/60 leading-[1.8] mb-6"
          >
            {story.story}
          </motion.p>
        </AnimatePresence>

        {/* Attribution */}
        <AuthorBadge author="ai" showRole={false} className="opacity-40" />
      </div>
    </motion.div>
  );
}
