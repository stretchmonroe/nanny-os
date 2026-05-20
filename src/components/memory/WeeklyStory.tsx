"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { weeklyMoments } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";
import AuthorBadge from "@/components/ui/AuthorBadge";

type Story = { headline: string; story: string };

const demo: Story = {
  headline: "The week he found his voice",
  story: "It began with a clap at the Saturday library — barely intentional, but entirely his. By Thursday he looked up mid-snack and said 'more' for the first time, clearly and on purpose. In between: a staircase climbed alone, a water table turned into pure celebration, a week of outdoor mornings that somehow added up to a boy who now knows what he wants — and how to ask for it.",
};

export default function WeeklyStory() {
  const [story, setStory] = useState<Story>(demo);
  const { activeChild } = useAppStore();

  useEffect(() => {
    const moments = weeklyMoments
      .flatMap(d => d.moments)
      .filter(m => m.type !== "audio")
      .map(m => m.content)
      .slice(0, 14);

    callAI("weeklyStory", {
      childName: activeChild.name,
      childAge: activeChild.age,
      moments,
      weekRange: "May 8–14",
    }).then(res => {
      if (!res) return;
      const parsed = parseAIJson<Story>(res.result, demo);
      if (parsed.headline && parsed.story) setStory(parsed);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="mx-4 rounded-[1.75rem] overflow-hidden"
      style={{
        background: "linear-gradient(162deg, var(--surface-card) 0%, #FAF5EC 100%)",
        border: "1.5px solid var(--border-soft)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="px-6 pt-6 pb-7">
        {/* Label row */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-amber-400/80 text-[11px] select-none leading-none">✦</span>
          <span className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest">
            Mateo&rsquo;s story · May 8–14
          </span>
        </div>

        {/* Headline */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={story.headline}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-[22px] font-extrabold text-foreground tracking-tight leading-snug mb-4"
          >
            {story.headline}
          </motion.h2>
        </AnimatePresence>

        {/* Amber rule */}
        <div
          className="h-[1px] mb-5"
          style={{
            background: "linear-gradient(to right, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0.12) 55%, transparent 100%)",
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
            className="text-[14px] text-foreground/60 leading-[1.78] mb-6"
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
