"use client";

import { motion } from "framer-motion";
import type { EnergyLevel, AdaptiveProfile } from "@/lib/adaptive-profile";
import type { TimeWindow } from "@/lib/activities";

const WINDOWS: { id: TimeWindow; emoji: string; label: string }[] = [
  { id: "morning-energy",      emoji: "🌞", label: "Morning"    },
  { id: "mid-morning-focus",   emoji: "🎯", label: "Mid-morning" },
  { id: "after-lunch-calm",    emoji: "🍃", label: "After lunch"  },
  { id: "afternoon-adventure", emoji: "⚡", label: "Afternoon"   },
  { id: "evening-wind-down",   emoji: "🌙", label: "Evening"     },
];

const LEVEL_META: Record<EnergyLevel, { fill: number; label: string }> = {
  "very-high": { fill: 0.93, label: "Very active"   },
  "high":      { fill: 0.76, label: "Energized"     },
  "moderate":  { fill: 0.58, label: "Balanced"      },
  "settling":  { fill: 0.40, label: "Settling"      },
  "gentle":    { fill: 0.24, label: "Winding down"  },
};

interface Props {
  rhythm: AdaptiveProfile["energyRhythm"];
}

export function EnergyRhythmMap({ rhythm }: Props) {
  return (
    <div className="space-y-3">
      {WINDOWS.map((w, i) => {
        const level = rhythm[w.id] ?? "moderate";
        const meta  = LEVEL_META[level];
        return (
          <div key={w.id} className="flex items-center gap-3">
            {/* Window label */}
            <div className="flex items-center gap-1.5 w-[100px] shrink-0">
              <span className="text-[15px] leading-none">{w.emoji}</span>
              <span className="text-[12px] font-medium text-foreground/55 leading-none">
                {w.label}
              </span>
            </div>

            {/* Bar track */}
            <div className="flex-1 h-[6px] rounded-full bg-black/5 dark:bg-white/8 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, var(--accent-soft), var(--accent-primary))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${meta.fill * 100}%` }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </div>

            {/* Energy label */}
            <span className="text-[11px] font-semibold text-muted-foreground/45 w-[80px] text-right shrink-0">
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
