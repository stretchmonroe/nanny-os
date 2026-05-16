"use client";

import type { ActivityOutcome } from "@/lib/execution";

interface OutcomePickerProps {
  value?: ActivityOutcome;
  onChange: (outcome: ActivityOutcome) => void;
}

const OPTIONS: { outcome: ActivityOutcome; emoji: string; label: string }[] = [
  { outcome: "great", emoji: "😊", label: "Great" },
  { outcome: "okay",  emoji: "🙂", label: "Okay"  },
  { outcome: "rough", emoji: "😓", label: "Rough"  },
];

export function OutcomePicker({ value, onChange }: OutcomePickerProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {OPTIONS.map(({ outcome, emoji, label }) => {
          const selected = value === outcome;
          return (
            <button
              key={outcome}
              onClick={() => onChange(outcome)}
              style={{
                flex: 1,
                padding: "10px 6px 8px",
                borderRadius: 14,
                border: `2px solid ${selected ? "var(--accent-primary)" : "var(--border-soft)"}`,
                background: selected ? "var(--accent-light)" : "var(--bg-warm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: selected ? "var(--accent-primary)" : "var(--text-light)",
                  letterSpacing: "0.03em",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
