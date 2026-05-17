"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { child, demoPatterns, recentMemories } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { PatternCard } from "./PatternCard";
import type { PatternInsight } from "@/lib/data/demo";

interface Props {
  onResearch?(): void;
}

export default function PatternsSection({ onResearch }: Props) {
  const [patterns, setPatterns] = useState<PatternInsight[]>(demoPatterns);

  useEffect(() => {
    const highlights = recentMemories
      .filter(m => m.type !== "photo")
      .slice(0, 18)
      .map(m => `${m.date} [${m.category}]: ${m.content}`);

    callAI("patterns", {
      childName: child.name,
      childAge: child.age,
      developmentalFocus: child.focus,
      journalHighlights: highlights,
    }).then(res => {
      if (!res) return;
      const parsed = parseAIJson<{ patterns?: PatternInsight[] }>(res.result, {});
      if (Array.isArray(parsed.patterns) && parsed.patterns.length >= 1) {
        const valid = parsed.patterns.filter(
          p => p.id && p.headline && p.detail && p.emoji && p.category && p.confidence
        );
        if (valid.length > 0) setPatterns(valid.slice(0, 3));
      }
    });
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.9 }}
      className="px-5"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles
          className="w-3 h-3 shrink-0"
          style={{ color: "var(--accent-primary)", opacity: 0.45 }}
        />
        <span className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest">
          What we&apos;re noticing · {child.name}
        </span>
      </div>

      {/* Pattern cards */}
      <div className="space-y-2.5">
        {patterns.slice(0, 3).map((p, i) => (
          <PatternCard key={p.id} pattern={p} delay={i * 0.08} />
        ))}
      </div>

      {/* Divider + footer */}
      <div className="mt-5 pt-4 border-t border-soft flex items-center justify-between">
        <p className="text-[9px] font-medium text-muted-foreground/25 tracking-wide">
          Sunny · learns as {child.name}&apos;s days are logged
        </p>
        {onResearch && (
          <button
            onClick={onResearch}
            className="text-[11px] font-semibold text-muted-foreground/35 active:opacity-70 transition-opacity"
          >
            Explore a topic →
          </button>
        )}
      </div>
    </motion.section>
  );
}
