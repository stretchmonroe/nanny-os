"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { todayInsights, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

function ageLabel(birthDate: string | null | undefined): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now   = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 24) return `${months} months`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""}`;
}

export default function InsightStrip({
  childName,
  childBirthDate,
}: {
  childName?: string | null;
  childBirthDate?: string | null;
}) {
  const [insight, setInsight] = useState(todayInsights[0]);

  useEffect(() => {
    const done    = schedule.filter((s) => s.done).map((s) => s.title);
    const current = schedule.find((s) => s.active)?.title;
    const name    = childName ?? "Mateo";
    const age     = ageLabel(childBirthDate) || "18 months";

    callAI("insights", {
      childName: name,
      childAge:  age,
      developmentalFocus: "Fine Motor Skills",
      completedActivities: done,
      currentActivity: current,
      timeOfDay: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<{ todayInsight?: string }>(res.result, {});
      if (parsed.todayInsight) setInsight(parsed.todayInsight);
    });
  }, [childName, childBirthDate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.9 }}
      className="px-7 py-2 text-center"
    >
      <Sparkles className="w-3.5 h-3.5 text-amber-400/50 mx-auto mb-2.5" />
      <p className="text-[13px] text-foreground/45 leading-relaxed italic">{insight}</p>
    </motion.div>
  );
}
