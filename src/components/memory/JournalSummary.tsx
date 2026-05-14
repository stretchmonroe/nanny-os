"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { aiJournalSummary, careNotes, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";

type Summary = {
  headline: string;
  summary: string;
  highlights: string[];
};

type Insights = {
  todayInsight?: string;
  careNote?: string;
};

const demoSummary: Summary = {
  headline: aiJournalSummary.headline,
  summary: aiJournalSummary.summary,
  highlights: aiJournalSummary.highlights,
};

export default function JournalSummary() {
  const [summary, setSummary] = useState<Summary>(demoSummary);
  const [liveNote, setLiveNote] = useState<string | null>(null);

  useEffect(() => {
    const done = schedule.filter((s) => s.done);

    callAI("insights", {
      childName: "Mateo",
      childAge: "18 months",
      developmentalFocus: "Fine Motor Skills",
      completedActivities: done.map((s) => s.title),
      timeOfDay: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<Insights>(res.result, {});
      if (parsed.careNote) setLiveNote(parsed.careNote);
    });

    const events = done.map((s) => ({
      type: s.type,
      content: s.notes ?? s.title,
      time: s.time,
    }));
    if (events.length === 0) return;

    callAI("dailySummary", { events }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<Summary>(res.result, demoSummary);
      if (parsed.headline) setSummary(parsed);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="mx-4 rounded-3xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 p-5 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        </div>
        <span className="text-[10px] font-bold text-amber-300/70 uppercase tracking-widest">
          Today&rsquo;s Summary
        </span>
      </div>

      {/* Headline + summary */}
      <p className="text-[20px] font-bold text-white leading-snug mb-2.5">
        &ldquo;{summary.headline}&rdquo;
      </p>
      <p className="text-sm text-stone-300/90 leading-relaxed mb-4">
        {summary.summary}
      </p>

      {/* Highlights */}
      <div className="flex flex-wrap gap-2 mb-4">
        {summary.highlights.map((h, i) => (
          <span
            key={i}
            className="text-xs bg-white/10 text-stone-200 px-3 py-1.5 rounded-full font-medium"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Care notes */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {careNotes.map((note, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-base shrink-0">{note.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                {note.label}
              </span>
              <p className="text-[13px] text-stone-300/90 leading-snug mt-0.5">
                {i === 2 && liveNote ? liveNote : note.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
