"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import SproutMark from "@/components/brand/SproutMark";
import SproutSheet from "./SproutSheet";
import SproutResearchSheet from "./SproutResearchSheet";
import type { SproutMode } from "./SproutSheet";

// ── Demo content — one sentence each ─────────────────────────────────────────

const DEMO_NOTICES = [
  "Outdoor mornings consistently produce his longest naps.",
  "Two new words in five days — language is accelerating.",
  "12 minutes of focused play on stacking rings. Attention is building.",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SproutNotice() {
  const [notices,      setNotices]     = useState(DEMO_NOTICES);
  const [current,      setCurrent]     = useState(0);
  const [stripVisible, setStripVisible]= useState(true);
  const [sheetMode,    setSheetMode]   = useState<SproutMode | null>(null);
  const [researchOpen, setResearchOpen]= useState(false);

  // Auto-advance rotation
  useEffect(() => {
    if (!stripVisible) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % notices.length), 9000);
    return () => clearInterval(t);
  }, [stripVisible, notices.length]);

  // Fetch AI insight — replaces first slot when Claude responds
  useEffect(() => {
    const done    = schedule.filter((s) => s.done).map((s) => s.title);
    const active  = schedule.find((s) => s.active)?.title;
    callAI("insights", {
      childName:           "Mateo",
      childAge:            "18 months",
      developmentalFocus:  "Language & Communication",
      completedActivities: done,
      currentActivity:     active,
      timeOfDay:           new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<{ todayInsight?: string }>(res.result, {});
      if (parsed.todayInsight) {
        setNotices((prev) => [parsed.todayInsight!, ...prev.slice(1)]);
      }
    });
  }, []);

  const ACTIONS: { mode: SproutMode; label: string }[] = [
    { mode: "suggest",   label: "Suggest"   },
    { mode: "summarize", label: "Summarize" },
    { mode: "history",   label: "History"   },
  ];

  return (
    <>
      <div className="mx-4 select-none">

        {/* ── Insight strip ──────────────────────────────────────────── */}
        <AnimatePresence>
          {stripVisible && (
            <motion.div
              key="strip"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.26, ease: [0.25, 1, 0.5, 1] }}
              className="overflow-hidden mb-2.5"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSheetMode("suggest")}
                onKeyDown={(e) => e.key === "Enter" && setSheetMode("suggest")}
                className="cursor-pointer"
                style={{
                  borderLeft:   "2.5px solid var(--sage)",
                  borderRadius: "0 14px 14px 0",
                  background:   "rgba(106,156,128,0.07)",
                  padding:      "11px 14px",
                }}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <SproutMark size={18} />
                  <span className="text-[9px] font-bold text-sage tracking-[0.13em] uppercase leading-none">
                    Sprout noticed
                  </span>

                  <div className="ml-auto flex items-center gap-2.5">
                    {/* Rotation dots */}
                    <div className="flex items-center gap-[3px]">
                      {notices.map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            width:      i === current ? 14 : 4,
                            background: i === current
                              ? "var(--sage)"
                              : "rgba(106,156,128,0.28)",
                          }}
                          transition={{ duration: 0.32, ease: "easeInOut" }}
                          style={{ height: 4, borderRadius: 99, flexShrink: 0 }}
                        />
                      ))}
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setStripVisible(false); }}
                      onKeyDown={(e) => { e.stopPropagation(); }}
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                      style={{ background: "rgba(106,156,128,0.14)" }}
                      aria-label="Dismiss"
                    >
                      <X size={9} strokeWidth={2.8} className="text-sage/55" />
                    </button>
                  </div>
                </div>

                {/* Rotating insight */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={current}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                    className="text-[13px] text-foreground/70 font-medium leading-snug"
                  >
                    {notices[current]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action row — always visible ──────────────────────────── */}
        <div className="flex items-center gap-0.5 pl-1">
          {/* Sprout identity when strip is hidden */}
          <AnimatePresence>
            {!stripVisible && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-1.5 mr-2 overflow-hidden"
              >
                <SproutMark size={13} />
                <span className="text-[9px] font-bold text-sage/50 tracking-[0.12em] uppercase whitespace-nowrap">
                  Sprout
                </span>
                <span className="text-muted-foreground/20 text-[10px]">·</span>
              </motion.div>
            )}
          </AnimatePresence>

          {ACTIONS.map(({ mode, label }, i) => (
            <span key={mode} className="flex items-center gap-0.5">
              {i > 0 && (
                <span className="text-[10px] text-muted-foreground/18 mx-1.5">·</span>
              )}
              <button
                onClick={() => setSheetMode(mode)}
                className="text-[10px] font-semibold text-muted-foreground/30 active:text-muted-foreground/60 transition-colors py-1"
              >
                {label}
              </button>
            </span>
          ))}

          <span className="text-[10px] text-muted-foreground/18 mx-1.5">·</span>
          <button
            onClick={() => setResearchOpen(true)}
            className="text-[10px] font-semibold text-muted-foreground/30 active:text-muted-foreground/60 transition-colors py-1"
          >
            Research
          </button>
        </div>

      </div>

      {/* Sheets */}
      <SproutSheet
        open={sheetMode !== null}
        onClose={() => setSheetMode(null)}
        initialMode={sheetMode ?? "suggest"}
      />
      <SproutResearchSheet
        open={researchOpen}
        onClose={() => setResearchOpen(false)}
      />
    </>
  );
}
