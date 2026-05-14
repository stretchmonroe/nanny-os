"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { aiJournalSummary, careNotes, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import AuthorBadge from "@/components/ui/AuthorBadge";

type Summary  = { headline: string; summary: string; highlights: string[] };
type Insights = { todayInsight?: string; careNote?: string };

const demoSummary: Summary = {
  headline:   aiJournalSummary.headline,
  summary:    aiJournalSummary.summary,
  highlights: aiJournalSummary.highlights,
};

export default function JournalSummary() {
  const [summary,  setSummary]  = useState<Summary>(demoSummary);
  const [liveNote, setLiveNote] = useState<string | null>(null);

  useEffect(() => {
    const done = schedule.filter((s) => s.done);

    callAI("insights", {
      childName:            "Mateo",
      childAge:             "18 months",
      developmentalFocus:   "Language & Communication",
      completedActivities:  done.map((s) => s.title),
      timeOfDay:            new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<Insights>(res.result, {});
      if (parsed.careNote) setLiveNote(parsed.careNote);
    });

    const events = done.map((s) => ({ type: s.type, content: s.notes ?? s.title, time: s.time }));
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
      className="mx-4 rounded-[2rem] overflow-hidden shadow-deep"
      style={{ background: "linear-gradient(145deg, #1C1916 0%, #221F1B 60%, #1C1916 100%)" }}
    >
      <div className="p-6">
        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="text-[10px] font-bold text-amber-300/55 uppercase tracking-widest">
            Today&rsquo;s Summary
          </span>
        </div>

        {/* Headline */}
        <p className="text-[24px] font-extrabold text-white leading-snug mb-3 tracking-tight">
          &ldquo;{summary.headline}&rdquo;
        </p>

        {/* Body */}
        <p className="text-[13px] text-white/65 leading-relaxed mb-5">
          {summary.summary}
        </p>

        {/* Highlight pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {summary.highlights.map((h, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold bg-white/8 text-white/80 px-3 py-1.5 rounded-full border border-white/10"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Care notes */}
        <div className="pt-5 border-t border-white/8 space-y-4">
          {careNotes.map((note, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <span className="text-[17px] shrink-0 mt-0.5">{note.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                  {note.label}
                </p>
                <p className="text-[13px] text-white/65 leading-snug">
                  {i === 2 && liveNote ? liveNote : note.note}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI attribution */}
        <div className="pt-4 mt-1 border-t border-white/8">
          <AuthorBadge author="ai" light className="opacity-50" />
        </div>
      </div>
    </motion.div>
  );
}
