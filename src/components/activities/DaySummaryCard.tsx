"use client";

import { useMemo } from "react";
import type { ExecutionMap } from "@/lib/execution";
import { TIME_WINDOW_ORDER } from "@/lib/activities";

interface DaySummaryCardProps {
  execution: ExecutionMap;
}

export function DaySummaryCard({ execution }: DaySummaryCardProps) {
  const stats = useMemo(() => {
    let done = 0, skipped = 0, great = 0, okay = 0, rough = 0;
    TIME_WINDOW_ORDER.forEach(w => {
      const e = execution[w];
      if (!e) return;
      if (e.status === "done") {
        done++;
        if (e.outcome === "great") great++;
        else if (e.outcome === "okay") okay++;
        else if (e.outcome === "rough") rough++;
      }
      if (e.status === "skipped") skipped++;
    });
    return { done, skipped, great, okay, rough, total: done + skipped };
  }, [execution]);

  if (stats.total < 2) return null;

  const outcomesRecorded = stats.great + stats.okay + stats.rough;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: "16px 18px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: "var(--text-light)",
          margin: "0 0 14px",
        }}
      >
        Today so far
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          <div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "var(--success)",
                margin: "0 0 1px",
                lineHeight: 1,
              }}
            >
              {stats.done}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
              done
            </p>
          </div>

          {stats.skipped > 0 && (
            <div>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "var(--text-light)",
                  margin: "0 0 1px",
                  lineHeight: 1,
                }}
              >
                {stats.skipped}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>
                skipped
              </p>
            </div>
          )}
        </div>

        {outcomesRecorded > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            {stats.great > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 16 }}>😊</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  {stats.great}×
                </span>
              </div>
            )}
            {stats.okay > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 16 }}>🙂</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  {stats.okay}×
                </span>
              </div>
            )}
            {stats.rough > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 16 }}>😓</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                  {stats.rough}×
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
