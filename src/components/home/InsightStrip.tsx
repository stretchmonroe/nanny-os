"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { todayInsights, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

export default function InsightStrip() {
  const [insight, setInsight] = useState(todayInsights[0]);

  useEffect(() => {
    const done = schedule.filter((s) => s.done).map((s) => s.title);
    const current = schedule.find((s) => s.active)?.title;

    callAI("insights", {
      childName: "Mateo",
      childAge: "18 months",
      developmentalFocus: "Fine Motor Skills",
      completedActivities: done,
      currentActivity: current,
      timeOfDay: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<{ todayInsight?: string }>(res.result, {});
      if (parsed.todayInsight) setInsight(parsed.todayInsight);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="px-5 flex items-start gap-2.5"
    >
      <Sparkles className="w-3 h-3 text-amber-400/80 shrink-0 mt-1" />
      <p className="text-[13px] text-stone-400 dark:text-stone-500 leading-relaxed">
        {insight}
      </p>
    </motion.div>
  );
}
