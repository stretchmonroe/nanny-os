"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { weeklyMoments } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

type DevStory = { story: string };

const demo: DevStory = {
  story: "Something is shifting in how Mateo communicates. It's not just one new word — it's the way he's started reaching, pointing, and now using his first real request. He's learning that his voice can get him somewhere, and he's testing that idea in every room he walks into.",
};

export default function DevelopmentStory() {
  const [data, setData] = useState<DevStory>(demo);

  useEffect(() => {
    const milestones = weeklyMoments
      .flatMap(d => d.moments)
      .filter(m => m.type === "milestone")
      .map(m => m.content);

    const observations = weeklyMoments
      .flatMap(d => d.moments)
      .filter(m => m.type === "note")
      .map(m => m.content)
      .slice(0, 5);

    callAI("developmentStory", {
      childName: "Mateo",
      childAge: "18 months",
      milestones,
      observations,
    }).then(res => {
      if (!res) return;
      const parsed = parseAIJson<DevStory>(res.result, demo);
      if (parsed.story) setData(parsed);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="mx-4 rounded-[1.5rem] px-5 py-5"
      style={{
        background: "var(--trust-light)",
        border: "1px solid rgba(91,127,160,0.12)",
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-3">
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--trust)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--trust)" }}>
          Something new
        </span>
      </div>

      {/* Narrative */}
      <AnimatePresence mode="wait">
        <motion.p
          key={data.story}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-[14px] leading-[1.72] text-foreground/70"
        >
          {data.story}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}
