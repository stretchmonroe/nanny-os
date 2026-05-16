"use client";

import type { Activity, TimeWindow } from "@/lib/activities";
import type { ActivityExecution } from "@/lib/execution";
import { ActivityCard } from "./ActivityCard";

interface TimeWindowSectionProps {
  windowId: TimeWindow;
  meta: { label: string; emoji: string; description: string };
  activity: Activity | undefined;
  isSwapping: boolean;
  anySwapping: boolean;
  onSwap: () => void;
  execution?: ActivityExecution;
  onStart: () => void;
  onComplete: () => void;
  onEditNote: () => void;
  onSkip: () => void;
  animDelay?: number;
}

export function TimeWindowSection({
  meta,
  activity,
  isSwapping,
  anySwapping,
  onSwap,
  execution,
  onStart,
  onComplete,
  onEditNote,
  onSkip,
  animDelay = 0,
}: TimeWindowSectionProps) {
  const isDone = execution?.status === "done";

  return (
    <div
      className="animate-fade-slide-up"
      style={{ opacity: 0, animationDelay: `${animDelay}ms` }}
    >
      {/* Window header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: "1.5px solid var(--border-soft)",
          opacity: isDone ? 0.55 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1 }}>{meta.emoji}</span>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {meta.label}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.3,
            }}
          >
            {meta.description}
          </p>
        </div>
      </div>

      {activity ? (
        <ActivityCard
          activity={activity}
          isSwapping={isSwapping}
          onSwap={onSwap}
          disabled={anySwapping}
          execution={execution}
          onStart={onStart}
          onComplete={onComplete}
          onEditNote={onEditNote}
          onSkip={onSkip}
        />
      ) : (
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "20px",
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          No activity yet
        </div>
      )}
    </div>
  );
}
