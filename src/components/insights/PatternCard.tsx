"use client";

import { motion } from "framer-motion";
import type { PatternInsight } from "@/lib/data/demo";

const CATEGORY_STYLES: Record<string, { color: string; bg: string }> = {
  sleep:       { color: "#6366f1", bg: "#eef2ff" },
  mood:        { color: "#d97706", bg: "#fffbeb" },
  engagement:  { color: "#2563eb", bg: "#eff6ff" },
  energy:      { color: "#059669", bg: "#ecfdf5" },
  language:    { color: "#FF7B54", bg: "#fff0e8" },
  social:      { color: "#7c3aed", bg: "#f5f3ff" },
};

interface PatternCardProps {
  pattern: PatternInsight;
  compact?: boolean;
  delay?: number;
}

export function PatternCard({ pattern, compact = false, delay = 0 }: PatternCardProps) {
  const style = CATEGORY_STYLES[pattern.category] ?? CATEGORY_STYLES.engagement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className="relative flex rounded-2xl bg-surface-card border-soft shadow-card overflow-hidden"
      style={{
        paddingLeft: 18,
        paddingRight: compact ? 14 : 16,
        paddingTop: compact ? 12 : 14,
        paddingBottom: compact ? 12 : 14,
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
        style={{ background: style.color }}
      />

      <div className="flex-1 min-w-0 pl-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-[20px] leading-none shrink-0 mt-px">{pattern.emoji}</span>
            <p
              className="font-semibold text-foreground leading-snug"
              style={{ fontSize: compact ? 13 : 14 }}
            >
              {pattern.headline}
            </p>
          </div>
          <span
            className="shrink-0 text-[9px] font-bold px-2 py-[3px] rounded-full leading-none mt-0.5 whitespace-nowrap"
            style={{ background: style.bg, color: style.color }}
          >
            {pattern.confidence === "consistent" ? "Consistent" : "Emerging"}
          </span>
        </div>

        {/* Detail */}
        <p
          className="text-muted-foreground/55 leading-relaxed"
          style={{ fontSize: compact ? 11 : 12 }}
        >
          {pattern.detail}
        </p>

        {/* Suggestion — hidden in compact mode */}
        {pattern.suggestion && !compact && (
          <p
            className="text-[11px] font-medium mt-2 leading-relaxed"
            style={{ color: style.color, opacity: 0.8 }}
          >
            → {pattern.suggestion}
          </p>
        )}
      </div>
    </motion.div>
  );
}
