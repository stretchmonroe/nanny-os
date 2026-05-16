"use client";

import type { Activity } from "@/lib/activities";
import type { ActivityExecution } from "@/lib/execution";
import { CATEGORY_COLORS } from "@/lib/activities";

interface ActivityCardProps {
  activity: Activity;
  isSwapping: boolean;
  onSwap: () => void;
  disabled: boolean;
  execution?: ActivityExecution;
  onStart: () => void;
  onComplete: () => void;
  onEditNote: () => void;
}

export function ActivityCard({
  activity,
  isSwapping,
  onSwap,
  disabled,
  execution,
  onStart,
  onComplete,
  onEditNote,
}: ActivityCardProps) {
  const status = execution?.status ?? "idle";
  const categoryColor = CATEGORY_COLORS[activity.category];

  const isActive = status === "active";
  const isDone = status === "done";

  const cardStyle: React.CSSProperties = {
    position: "relative",
    background: isActive ? "#FFFAF7" : "white",
    borderRadius: 20,
    padding: "18px 18px 14px",
    boxShadow: isActive
      ? "0 0 0 2px var(--accent-primary), 0 4px 20px rgba(255,123,84,0.12)"
      : isDone
      ? "0 2px 8px rgba(0,0,0,0.04)"
      : "0 2px 16px rgba(0,0,0,0.06)",
    opacity: isDone ? 0.82 : 1,
    transition: "all 0.25s ease",
  };

  return (
    <div
      className={status === "idle" ? "animate-fade-slide-up" : ""}
      style={
        status === "idle"
          ? { ...cardStyle, opacity: 0 }
          : cardStyle
      }
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
            <p
              style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}
            >
              Finding something new…
            </p>
          </div>
        </div>
      )}

      {/* Top row: emoji + status/category badges */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 36,
            lineHeight: 1,
            flexShrink: 0,
            filter: isDone ? "grayscale(0.3)" : "none",
          }}
        >
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
          {/* Status badges */}
          {isActive && (
            <span
              style={{
                background: "var(--accent-light)",
                color: "var(--accent-primary)",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                  display: "inline-block",
                  animation: "pulse-soft 1.2s infinite",
                }}
              />
              Active
            </span>
          )}

          {isDone && (
            <span
              style={{
                background: "rgba(91,200,168,0.12)",
                color: "var(--success)",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ✓ Done
            </span>
          )}

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
                background: "rgba(91,200,168,0.15)",
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
          color: isDone ? "var(--text-secondary)" : "var(--text-primary)",
          margin: "0 0 6px",
          lineHeight: 1.3,
          textDecoration: isDone ? "line-through" : "none",
          textDecorationColor: "var(--border-soft)",
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

      {/* Purpose — hidden when done to keep card compact */}
      {!isDone && (
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
      )}

      {/* Materials — hidden when done */}
      {!isDone && activity.materials.length > 0 && (
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

      {/* Inline note (done state) */}
      {isDone && execution?.note && (
        <div
          style={{
            background: "var(--bg-warm)",
            borderRadius: 12,
            padding: "10px 12px",
            marginBottom: 10,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0 }}>📝</span>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            {execution.note}
          </p>
        </div>
      )}

      {/* Action row */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginTop: isDone ? 4 : 0,
        }}
      >
        {/* Idle state */}
        {status === "idle" && (
          <>
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

            <button
              onClick={onStart}
              disabled={disabled}
              style={{
                flex: 1,
                background: disabled
                  ? "var(--border-soft)"
                  : "linear-gradient(135deg, #5BC8A8, #4DB896)",
                color: disabled ? "var(--text-light)" : "white",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 700,
                cursor: disabled ? "not-allowed" : "pointer",
                boxShadow: disabled
                  ? "none"
                  : "0 3px 12px rgba(91,200,168,0.3)",
                transition: "all 0.18s ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              ▶ Start
            </button>
          </>
        )}

        {/* Active state */}
        {status === "active" && (
          <>
            <button
              onClick={onSwap}
              disabled={disabled || isSwapping}
              style={{
                background: "var(--bg-warm)",
                color: "var(--text-secondary)",
                border: "1.5px solid var(--border-soft)",
                borderRadius: 10,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: disabled || isSwapping ? "not-allowed" : "pointer",
                opacity: disabled || isSwapping ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 4,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span>↻</span> Change
            </button>

            <button
              onClick={onComplete}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #FF7B54, #FF9A6C)",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "11px 14px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 3px 12px rgba(255,123,84,0.3)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Mark done ✓
            </button>
          </>
        )}

        {/* Done state */}
        {status === "done" && (
          <button
            onClick={onEditNote}
            style={{
              background: "transparent",
              color: "var(--text-secondary)",
              border: "none",
              padding: "4px 0",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 14 }}>
              {execution?.note ? "✏️" : "📝"}
            </span>
            {execution?.note ? "Edit note" : "Add note"}
          </button>
        )}
      </div>
    </div>
  );
}
