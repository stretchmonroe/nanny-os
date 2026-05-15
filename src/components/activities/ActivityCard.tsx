"use client";

import type { Activity } from "@/lib/activities";
import { CATEGORY_COLORS } from "@/lib/activities";

interface ActivityCardProps {
  activity: Activity;
  isSwapping: boolean;
  onSwap: () => void;
  disabled: boolean;
}

export function ActivityCard({
  activity,
  isSwapping,
  onSwap,
  disabled,
}: ActivityCardProps) {
  const categoryColor = CATEGORY_COLORS[activity.category];

  return (
    <div
      className="animate-fade-slide-up"
      style={{
        position: "relative",
        background: "white",
        borderRadius: 20,
        padding: "18px 18px 14px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        opacity: 0,
      }}
    >
      {/* Swapping overlay */}
      {isSwapping && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            background: "rgba(255,255,255,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "3px solid var(--accent-light)",
                borderTopColor: "var(--accent-primary)",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 8px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Finding something new…
            </p>
          </div>
        </div>
      )}

      {/* Top row: emoji + badges */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>
          {activity.emoji}
        </span>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "flex-end",
            paddingTop: 2,
          }}
        >
          {/* Category chip */}
          <span
            style={{
              background: categoryColor.bg,
              color: categoryColor.text,
              borderRadius: 99,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {activity.category}
          </span>

          {/* Montessori badge */}
          {activity.isMontessori && (
            <span
              style={{
                background: "rgba(91, 200, 168, 0.15)",
                color: "var(--success)",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              🌿 Montessori
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 6px",
          lineHeight: 1.3,
        }}
      >
        {activity.title}
      </h3>

      {/* Duration */}
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          margin: "0 0 10px",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span>⏱</span> {activity.duration}
      </p>

      {/* Purpose */}
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--text-primary)",
          margin: "0 0 14px",
        }}
      >
        {activity.purpose}
      </p>

      {/* Materials */}
      {activity.materials.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-light)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              margin: "0 0 6px",
            }}
          >
            You&apos;ll need
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {activity.materials.map((m) => (
              <span
                key={m}
                style={{
                  background: "var(--bg-warm)",
                  border: "1.5px solid var(--border-soft)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Swap button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onSwap}
          disabled={disabled || isSwapping}
          style={{
            background: "var(--accent-light)",
            color: "var(--accent-primary)",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: disabled || isSwapping ? "not-allowed" : "pointer",
            opacity: disabled || isSwapping ? 0.5 : 1,
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: 5,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ fontSize: 15 }}>↻</span> Try another
        </button>
      </div>
    </div>
  );
}
