"use client";

import type { ExecutionMap } from "@/lib/execution";
import { TIME_WINDOW_ORDER } from "@/lib/activities";

interface DayProgressProps {
  execution: ExecutionMap;
}

export function DayProgress({ execution }: DayProgressProps) {
  const doneCount = TIME_WINDOW_ORDER.filter(
    (w) => execution[w]?.status === "done"
  ).length;

  const skippedCount = TIME_WINDOW_ORDER.filter(
    (w) => execution[w]?.status === "skipped"
  ).length;

  const activeWindow = TIME_WINDOW_ORDER.find(
    (w) => execution[w]?.status === "active"
  );

  if (doneCount === 0 && skippedCount === 0 && !activeWindow) return null;

  return (
    <div
      className="animate-fade-slide-up"
      style={{
        padding: "10px 20px 4px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: 0,
      }}
    >
      {/* Dots */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {TIME_WINDOW_ORDER.map((w) => {
          const status = execution[w]?.status ?? "idle";
          return (
            <div
              key={w}
              style={{
                width: status === "active" ? 10 : 8,
                height: status === "active" ? 10 : 8,
                borderRadius: "50%",
                background:
                  status === "done"
                    ? "var(--success)"
                    : status === "active"
                    ? "var(--accent-primary)"
                    : status === "skipped"
                    ? "var(--border-medium)"
                    : "var(--border-soft)",
                transition: "all 0.3s ease",
                boxShadow:
                  status === "active"
                    ? "0 0 0 3px rgba(255,123,84,0.2)"
                    : "none",
              }}
            />
          );
        })}
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: 0,
          fontWeight: 500,
        }}
      >
        {activeWindow ? (
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
            In progress
          </span>
        ) : doneCount + skippedCount === TIME_WINDOW_ORDER.length ? (
          <span style={{ color: "var(--success)", fontWeight: 600 }}>
            All done today 🎉
          </span>
        ) : (
          `${doneCount} of ${TIME_WINDOW_ORDER.length} done${skippedCount > 0 ? ` · ${skippedCount} skipped` : ""}`
        )}
      </p>
    </div>
  );
}
