"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChildProfile } from "@/lib/onboarding-flow";
import type { Activity, TimeWindow } from "@/lib/activities";
import { TIME_WINDOW_META, TIME_WINDOW_ORDER } from "@/lib/activities";
import type { ActivityOutcome, ExecutionMap } from "@/lib/execution";
import { loadExecution, persistExecution } from "@/lib/execution";
import { saveActivityLog } from "@/lib/supabase/activityLogs";
import { TimeWindowSection } from "@/components/activities/TimeWindowSection";
import { ActivitiesLoadingSkeleton } from "@/components/activities/ActivitiesLoadingSkeleton";
import { DayProgress } from "@/components/activities/DayProgress";
import { DaySummaryCard } from "@/components/activities/DaySummaryCard";
import { QuickNoteModal } from "@/components/activities/QuickNoteModal";
import { PatternCard } from "@/components/insights/PatternCard";
import { demoPatterns } from "@/lib/data/demo";
import { loadAdaptiveProfile } from "@/lib/adaptive-profile";
import type { PatternInsight } from "@/lib/data/demo";
import type { AdaptiveProfile } from "@/lib/adaptive-profile";
import { useAppStore } from "@/store/useAppStore";

type Status = "loading" | "loaded" | "error";

function getContextualPattern(exec: ExecutionMap, acts: Activity[]): PatternInsight {
  const doneCategories = new Set(
    Object.entries(exec)
      .filter(([, e]) => e?.status === "done")
      .flatMap(([w]) => {
        const cat = acts.find(a => a.timeWindow === (w as TimeWindow))?.category;
        return cat ? [cat] : [];
      })
  );
  if (doneCategories.has("outdoor") || doneCategories.has("motor")) return demoPatterns[0];
  if (doneCategories.has("language")) return demoPatterns[1];
  if (doneCategories.has("sensory")) return demoPatterns[2];
  return demoPatterns[0];
}

export default function ActivitiesPage() {
  const { activeChildId, activeChild } = useAppStore();

  const profile = useMemo<ChildProfile>(() => ({
    name:                 activeChild.name || "Child",
    age:                  activeChild.age  || "1 year",
    sleepPattern:         "regular",
    activityLevel:        "moderate",
    languageDevelopment:  "typical",
    favoriteActivities:   [],
    sensorySensitivities: [],
    environmentPreference: "both",
    developmentalFocus:   [],
    montessoriInterest:   "moderate",
  }), [activeChild.name, activeChild.age]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [swappingWindow, setSwappingWindow] = useState<TimeWindow | null>(null);
  const [execution, setExecution] = useState<ExecutionMap>({});
  const [noteTarget, setNoteTarget] = useState<TimeWindow | null>(null);

  const updateExecution = useCallback((map: ExecutionMap) => {
    setExecution(map);
    persistExecution(map);
  }, []);

  const fetchActivities = useCallback(async (prof: ChildProfile) => {
    setStatus("loading");
    setActivities([]);
    try {
      let adaptive: AdaptiveProfile | null = null;
      try { adaptive = loadAdaptiveProfile(prof.name); } catch { /* ignore */ }

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: prof, adaptive }),
      });
      const data = await res.json();
      if (!res.ok || !data.activities) throw new Error(data.error || "Failed");
      setActivities(data.activities);
      setStatus("loaded");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setExecution(loadExecution());
    fetchActivities(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChildId]);

  // --- Execution handlers ---

  const handleStart = (window: TimeWindow) => {
    const next: ExecutionMap = {
      ...execution,
      [window]: { status: "active", startedAt: Date.now() },
    };
    updateExecution(next);
  };

  const handleComplete = (window: TimeWindow) => {
    const next: ExecutionMap = {
      ...execution,
      [window]: {
        ...execution[window],
        status: "done",
        completedAt: Date.now(),
      },
    };
    updateExecution(next);
    setNoteTarget(window);
  };

  const handleSkip = (window: TimeWindow) => {
    const activity = activities.find(a => a.timeWindow === window);
    const next: ExecutionMap = {
      ...execution,
      [window]: {
        ...execution[window],
        status: "skipped",
        skippedAt: Date.now(),
      },
    };
    updateExecution(next);

    if (activity) {
      saveActivityLog({
        date: new Date().toISOString().slice(0, 10),
        child_id: activeChildId,
        time_window: window,
        planned_title: activity.title,
        planned_category: activity.category,
        status: "skipped",
      });
    }
  };

  const handleSaveNote = (note: string, outcome?: ActivityOutcome) => {
    if (!noteTarget) return;
    const activity = activities.find(a => a.timeWindow === noteTarget);
    const next: ExecutionMap = {
      ...execution,
      [noteTarget]: {
        ...execution[noteTarget],
        note: note || undefined,
        outcome,
      },
    };
    updateExecution(next);
    setNoteTarget(null);

    if (activity) {
      saveActivityLog({
        date: new Date().toISOString().slice(0, 10),
        child_id: activeChildId,
        time_window: noteTarget,
        planned_title: activity.title,
        planned_category: activity.category,
        status: "done",
        outcome,
        note: note || undefined,
      });
    }
  };

  const handleEditNote = (window: TimeWindow) => {
    setNoteTarget(window);
  };

  // --- Swap handler ---

  const handleSwap = async (window: TimeWindow) => {
    if (swappingWindow) return;
    const prevActivity = activities.find(a => a.timeWindow === window);
    setSwappingWindow(window);
    const clearedExec: ExecutionMap = { ...execution };
    delete clearedExec[window];
    updateExecution(clearedExec);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, swapWindow: window }),
      });
      const data = await res.json();
      if (!res.ok || !data.activity) throw new Error(data.error || "Failed");
      const newActivity: Activity = data.activity;
      setActivities((prev) =>
        prev.map((a) => (a.timeWindow === window ? newActivity : a))
      );
      // Log the swap so AI knows what was replaced
      if (prevActivity) {
        saveActivityLog({
          date: new Date().toISOString().slice(0, 10),
          child_id: activeChildId,
          time_window: window,
          planned_title: prevActivity.title,
          planned_category: prevActivity.category,
          status: "skipped",
          replaced_by: newActivity.title,
        });
      }
    } catch {
      // Keep existing card on failure
    } finally {
      setSwappingWindow(null);
    }
  };

  const handleNewPlan = () => {
    updateExecution({});
    fetchActivities(profile);
  };

  const noteActivity = noteTarget
    ? activities.find((a) => a.timeWindow === noteTarget)
    : null;

  return (
    <>
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--bg-warm)",
          display: "flex",
          flexDirection: "column",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "var(--bg-warm)",
            padding: "16px 20px 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom:
              status === "loaded"
                ? "1.5px solid var(--border-soft)"
                : "none",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF7B54, #FFB085)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
              boxShadow: "0 3px 10px rgba(255,123,84,0.25)",
            }}
          >
            ☀️
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {profile.name}&apos;s Day
            </h1>
            <p
              style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}
            >
              5 flexible activity windows
            </p>
          </div>

          {status === "loaded" && (
            <button
              onClick={handleNewPlan}
              disabled={Boolean(swappingWindow)}
              style={{
                background: "var(--accent-light)",
                color: "var(--accent-primary)",
                border: "none",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: swappingWindow ? "not-allowed" : "pointer",
                opacity: swappingWindow ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                transition: "opacity 0.15s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>↺</span> New plan
            </button>
          )}
        </div>

        {/* Day progress strip */}
        {status === "loaded" && <DayProgress execution={execution} />}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
          {status === "loading" && (
            <ActivitiesLoadingSkeleton childName={profile.name} />
          )}

          {status === "error" && (
            <div
              style={{
                padding: "40px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: 48 }}>🌿</span>
              <div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: "0 0 8px",
                  }}
                >
                  Something got mixed up
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--text-secondary)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  We couldn&apos;t generate activities just now. Let&apos;s try
                  again.
                </p>
              </div>
              <button
                className="btn-primary"
                style={{ maxWidth: 240 }}
                onClick={handleNewPlan}
              >
                Try again
              </button>
            </div>
          )}

          {status === "loaded" && (
            <div
              style={{
                padding: "16px 20px 60px",
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              {TIME_WINDOW_ORDER.map((windowId, i) => {
                const activity = activities.find(
                  (a) => a.timeWindow === windowId
                );
                return (
                  <TimeWindowSection
                    key={windowId}
                    windowId={windowId}
                    meta={TIME_WINDOW_META[windowId]}
                    activity={activity}
                    isSwapping={swappingWindow === windowId}
                    anySwapping={Boolean(swappingWindow)}
                    onSwap={() => handleSwap(windowId)}
                    execution={execution[windowId]}
                    onStart={() => handleStart(windowId)}
                    onComplete={() => handleComplete(windowId)}
                    onEditNote={() => handleEditNote(windowId)}
                    onSkip={() => handleSkip(windowId)}
                    animDelay={i * 80}
                  />
                );
              })}

              <DaySummaryCard execution={execution} />

              {Object.values(execution).some(e => e?.status === "done") && (
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.09em",
                      color: "var(--text-light)",
                      margin: "0 0 8px 4px",
                    }}
                  >
                    Pattern · {activeChild.name}
                  </p>
                  <PatternCard
                    pattern={getContextualPattern(execution, activities)}
                    compact
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick note modal — rendered outside the constrained container */}
      {noteTarget && noteActivity && (
        <QuickNoteModal
          activityTitle={noteActivity.title}
          initialNote={execution[noteTarget]?.note ?? ""}
          initialOutcome={execution[noteTarget]?.outcome}
          onSave={handleSaveNote}
          onSkip={() => setNoteTarget(null)}
        />
      )}
    </>
  );
}
