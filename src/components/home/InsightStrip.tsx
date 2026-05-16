"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { todayInsights, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { loadExecution } from "@/lib/execution";
import type { ExecutionSummary } from "@/lib/ai/prompts/insights";

interface Props {
  onResearch?(): void;
}

export default function InsightStrip({ onResearch }: Props) {
  const [insight, setInsight] = useState(todayInsights[0]);

  useEffect(() => {
    const done = schedule.filter((s) => s.done).map((s) => s.title);
    const current = schedule.find((s) => s.active)?.title;

    // Enrich with real execution outcomes when available
    let executionSummary: ExecutionSummary | undefined;
    try {
      const exec = loadExecution();
      const completed = Object.entries(exec)
        .filter(([, e]) => e.status === "done")
        .map(([window, e]) => ({
          title: window.replace(/-/g, " "),
          outcome: e.outcome,
          note: e.note,
        }));
      const skipped = Object.entries(exec)
        .filter(([, e]) => e.status === "skipped")
        .map(([window]) => window.replace(/-/g, " "));
      if (completed.length + skipped.length > 0) {
        executionSummary = { completed, skipped };
      }
    } catch {
      // sessionStorage unavailable — skip
    }

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
      executionSummary,
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
      transition={{ delay: 0.8, duration: 0.9 }}
      className="px-7 py-2 text-center"
    >
      <Sparkles
        className="w-3.5 h-3.5 mx-auto mb-2"
        style={{ color: "var(--accent-primary)", opacity: 0.4 }}
      />
      <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-2">
        AI · Evidence-informed
      </p>
      <p className="text-[13px] text-foreground/45 leading-relaxed italic">
        {insight}
      </p>
      {onResearch && (
        <button
          onClick={onResearch}
          className="mt-3 text-[11px] font-semibold text-muted-foreground/35 active:opacity-70 transition-opacity"
        >
          Research a topic →
        </button>
      )}
    </motion.div>
  );
}
