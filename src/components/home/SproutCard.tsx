"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, FileText, Clock, Search } from "lucide-react";
import { aiSuggestion, schedule } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import { useAppStore } from "@/store/useAppStore";
import SproutMark from "@/components/brand/SproutMark";
import SproutSheet from "./SproutSheet";
import SproutResearchSheet from "./SproutResearchSheet";
import type { SproutMode } from "./SproutSheet";

const DEMO_OBS = aiSuggestion.body;

const ACTIONS: { mode: SproutMode; icon: React.ElementType; label: string }[] = [
  { mode: "suggest",   icon: Lightbulb, label: "Suggest"   },
  { mode: "summarize", icon: FileText,  label: "Summarize" },
  { mode: "history",   icon: Clock,     label: "History"   },
];

export default function SproutCard() {
  const [observation,    setObservation]    = useState(DEMO_OBS);
  const [sheetMode,      setSheetMode]      = useState<SproutMode | null>(null);
  const [researchOpen,   setResearchOpen]   = useState(false);
  const { activeChild } = useAppStore();

  useEffect(() => {
    const done    = schedule.filter((s) => s.done).map((s) => s.title);
    const current = schedule.find((s) => s.active)?.title;
    callAI("insights", {
      childName:           activeChild.name,
      childAge:            activeChild.age,
      developmentalFocus:  "Language & Communication",
      completedActivities: done,
      currentActivity:     current,
      timeOfDay:           new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    }).then((res) => {
      if (!res) return;
      const parsed = parseAIJson<{ todayInsight?: string }>(res.result, {});
      if (parsed.todayInsight) setObservation(parsed.todayInsight);
    });
  }, []);

  return (
    <>
      <motion.div
        className="mx-4 rounded-[1.75rem] overflow-hidden border-soft shadow-elevated"
        style={{
          background: "linear-gradient(148deg, var(--sage-light) 0%, var(--surface-card) 58%)",
        }}
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="px-5 pt-5 pb-5">

          {/* Identity row */}
          <div className="flex items-center gap-2.5 mb-4">
            <SproutMark size={28} priority />
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-bold text-sage tracking-[0.13em] uppercase leading-none">
                Sprout
              </span>
              <span className="text-[8px] text-muted-foreground/30 font-medium tracking-wide leading-none mt-0.5">
                by Ankur
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-sage"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-[9px] text-muted-foreground/30 font-medium tracking-wide">
                with Mateo today
              </span>
            </div>
          </div>

          {/* Observation — single thoughtful sentence */}
          <p className="text-[15px] text-foreground/85 leading-relaxed font-medium">
            {observation}
          </p>

          {/* Divider + actions */}
          <div className="mt-5 pt-4 border-t border-sage-light/60 dark:border-sage-light/15">
            <div className="flex items-center gap-2">
              {ACTIONS.map(({ mode, icon: Icon, label }) => (
                <motion.button
                  key={mode}
                  onClick={() => setSheetMode(mode)}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-colors"
                  style={{ background: "var(--surface-raised)", color: "var(--text-secondary)" }}
                >
                  <Icon size={10} strokeWidth={2} />
                  {label}
                </motion.button>
              ))}

              <button
                onClick={() => setResearchOpen(true)}
                className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/40 active:opacity-70 transition-opacity"
              >
                <Search size={10} strokeWidth={2} />
                Research
              </button>
            </div>
          </div>

        </div>
      </motion.div>

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
