"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { child as demoChild, demoPatterns, recentMemories } from "@/lib/data/demo";
import { callAI, parseAIJson } from "@/lib/ai/client";
import {
  demoAdaptiveProfile,
  isAdaptiveProfileStale,
  loadAdaptiveProfile,
  saveAdaptiveProfile,
} from "@/lib/adaptive-profile";
import { EnergyRhythmMap } from "./EnergyRhythmMap";
import type { AdaptiveProfile } from "@/lib/adaptive-profile";
import type { ChildProfile } from "@/lib/onboarding-flow";

interface Props {
  open: boolean;
  onClose(): void;
}

const ACTIVITY_LABELS: Record<string, string> = {
  "arts-crafts":    "Arts & crafts",
  "building-blocks":"Building",
  "music-dance":    "Music & dance",
  "pretend-play":   "Pretend play",
  "books-stories":  "Books",
  "outdoor-play":   "Outdoors",
  puzzles:          "Puzzles",
  "water-play":     "Water play",
  animals:          "Animals",
  cooking:          "Kitchen helper",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  "arts-crafts":    "🎨",
  "building-blocks":"🧱",
  "music-dance":    "🎵",
  "pretend-play":   "🎭",
  "books-stories":  "📚",
  "outdoor-play":   "🌿",
  puzzles:          "🧩",
  "water-play":     "💧",
  animals:          "🐾",
  cooking:          "🍳",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-muted-foreground/35 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-soft my-5" />;
}

export default function ProfileSheet({ open, onClose }: Props) {
  const [adaptive, setAdaptive]   = useState<AdaptiveProfile>(demoAdaptiveProfile);
  const [profile,  setProfile]    = useState<ChildProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // Load base profile from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nannyos_profile");
      if (raw) setProfile(JSON.parse(raw) as ChildProfile);
    } catch {
      // use demo data
    }
  }, []);

  const childName = profile?.name ?? demoChild.name;
  const childAge  = profile?.age  ?? demoChild.age;

  // Load or refresh adaptive profile
  const refreshProfile = useCallback(async (force = false) => {
    const saved = loadAdaptiveProfile(childName);
    if (saved && !force && !isAdaptiveProfileStale(saved)) {
      setAdaptive(saved);
      return;
    }

    setRefreshing(true);
    try {
      const baseProfile = profile ?? {
        name: demoChild.name,
        age: demoChild.age,
        activityLevel: "high-energy",
        sleepPattern: "great-sleeper",
        languageDevelopment: "first-words",
        favoriteActivities: ["outdoor-play", "water-play", "building-blocks"],
        sensorySensitivities: ["none"],
        environmentPreference: "both",
        developmentalFocus: ["language", "motor-skills"],
        montessoriInterest: "curious",
      };

      const highlights = recentMemories
        .filter(m => m.type !== "photo")
        .slice(0, 16)
        .map(m => `${m.date} [${m.category}]: ${m.content}`);

      const res = await callAI("profileUpdate", {
        profile: baseProfile,
        patterns: demoPatterns,
        journalHighlights: highlights,
      });

      if (res) {
        const parsed = parseAIJson<Partial<AdaptiveProfile>>(res.result, {});
        if (parsed.personalitySummary) {
          const updated: AdaptiveProfile = {
            childName,
            personalitySummary:   parsed.personalitySummary   ?? adaptive.personalitySummary,
            energyRhythm:         parsed.energyRhythm         ?? adaptive.energyRhythm,
            engagementHighlights: parsed.engagementHighlights ?? adaptive.engagementHighlights,
            currentStrengths:     parsed.currentStrengths     ?? adaptive.currentStrengths,
            growthEdges:          parsed.growthEdges          ?? adaptive.growthEdges,
            recommendationHints:  parsed.recommendationHints  ?? adaptive.recommendationHints,
            lastUpdated: new Date().toISOString(),
          };
          setAdaptive(updated);
          saveAdaptiveProfile(updated);
          setJustRefreshed(true);
          setTimeout(() => setJustRefreshed(false), 3000);
        }
      }
    } catch {
      // keep current
    } finally {
      setRefreshing(false);
    }
  }, [childName, profile, adaptive]);

  // Load when sheet opens
  useEffect(() => {
    if (open) refreshProfile();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const favs = profile?.favoriteActivities ?? ["outdoor-play", "water-play", "building-blocks", "books-stories"];

  const updatedLabel = (() => {
    try {
      const d = new Date(adaptive.lastUpdated);
      const diffH = Math.round((Date.now() - d.getTime()) / 3600000);
      if (diffH < 1)  return "Just updated";
      if (diffH < 24) return `Updated ${diffH}h ago`;
      return `Updated ${Math.round(diffH / 24)}d ago`;
    } catch { return ""; }
  })();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ps-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="ps-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            style={{ maxHeight: "92dvh" }}
          >
            <div
              className="rounded-t-[2rem] overflow-hidden flex flex-col"
              style={{
                background: "var(--surface-card)",
                maxHeight: "92dvh",
              }}
            >
              {/* Sticky top bar */}
              <div className="px-5 pt-3 pb-4 shrink-0">
                <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-4" />

                <div className="flex items-start justify-between">
                  {/* Child identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.1rem] bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-900/80 dark:to-orange-900/60 flex items-center justify-center text-[24px] shadow-card">
                      {demoChild.emoji}
                    </div>
                    <div>
                      <h2 className="text-[20px] font-black text-foreground tracking-tight leading-none">
                        {childName}
                      </h2>
                      <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
                        {childAge} · Learning profile
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={() => refreshProfile(true)}
                      disabled={refreshing}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
                      title="Refresh profile"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 pb-10 scrollbar-hide">

                {/* Personality summary */}
                <div
                  className="rounded-2xl p-4 mb-5 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,123,84,0.06) 0%, rgba(255,176,133,0.04) 100%)",
                    border: "1.5px solid rgba(255,123,84,0.12)",
                  }}
                >
                  {/* Sunny attribution */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                      style={{ background: "linear-gradient(135deg, #FF7B54, #FFB085)" }}
                    >
                      ☀️
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                      Sunny&apos;s take on {childName}
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={adaptive.personalitySummary.slice(0, 20)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-[14px] text-foreground/80 leading-relaxed"
                    >
                      {adaptive.personalitySummary}
                    </motion.p>
                  </AnimatePresence>

                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground/30 mt-3 font-medium">
                    {justRefreshed ? "✓ Just updated" : updatedLabel}
                  </p>
                </div>

                {/* Energy rhythm */}
                <SectionLabel>Energy through the day</SectionLabel>
                <EnergyRhythmMap rhythm={adaptive.energyRhythm} />

                <Divider />

                {/* What they love */}
                <SectionLabel>What {childName} loves</SectionLabel>
                <div className="flex flex-wrap gap-2 mb-1">
                  {favs.map(a => (
                    <span
                      key={a}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-muted text-foreground/70"
                    >
                      <span>{ACTIVITY_EMOJI[a] ?? "✨"}</span>
                      {ACTIVITY_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>

                <Divider />

                {/* Engagement highlights */}
                <SectionLabel>How {childName} engages</SectionLabel>
                <div className="space-y-2.5 mb-1">
                  {adaptive.engagementHighlights.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.3 }}
                      className="flex gap-2.5"
                    >
                      <span className="text-[14px] shrink-0 mt-0.5">✦</span>
                      <p className="text-[13px] text-foreground/65 leading-relaxed">{h}</p>
                    </motion.div>
                  ))}
                </div>

                <Divider />

                {/* Strengths */}
                <SectionLabel>Current strengths</SectionLabel>
                <div className="space-y-2.5 mb-1">
                  {adaptive.currentStrengths.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
                      className="flex gap-2.5"
                    >
                      <span className="text-[14px] shrink-0 mt-0.5">🌿</span>
                      <p className="text-[13px] text-foreground/65 leading-relaxed">{s}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Growth edges — only if present */}
                {adaptive.growthEdges.length > 0 && (
                  <>
                    <Divider />
                    <SectionLabel>Growing into</SectionLabel>
                    <div className="space-y-2.5 mb-1">
                      {adaptive.growthEdges.map((g, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
                          className="flex gap-2.5"
                        >
                          <span className="text-[14px] shrink-0 mt-0.5">🌱</span>
                          <p className="text-[13px] text-foreground/65 leading-relaxed">{g}</p>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                <Divider />

                {/* AI attribution footer */}
                <p className="text-[10px] text-muted-foreground/25 text-center leading-relaxed pb-2">
                  AI · Evidence-informed · Not a clinical assessment
                  <br />
                  Profile updates as {childName}&apos;s days are logged
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
