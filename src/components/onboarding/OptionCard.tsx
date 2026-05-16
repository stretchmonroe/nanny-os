"use client";

interface OptionCardProps {
  emoji: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  multiSelect?: boolean;
  animDelay?: number;
}

export function OptionCard({
  emoji,
  label,
  description,
  selected,
  onSelect,
  multiSelect,
  animDelay = 0,
}: OptionCardProps) {
  return (
    <button
      onClick={onSelect}
      className="option-card animate-fade-slide-up"
      style={{
        animationDelay: `${animDelay}ms`,
        opacity: 0,
        width: "100%",
        textAlign: "left",
        border: `2px solid ${selected ? "var(--accent-primary)" : "var(--border-soft)"}`,
        borderRadius: 16,
        padding: description ? "14px 16px" : "13px 16px",
        background: selected ? "var(--accent-light)" : "white",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: selected
          ? "0 4px 16px rgba(255, 123, 84, 0.15)"
          : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Emoji */}
      <span
        style={{
          fontSize: 26,
          lineHeight: 1,
          flexShrink: 0,
          width: 36,
          textAlign: "center",
        }}
      >
        {emoji}
      </span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: selected ? "var(--accent-primary)" : "var(--text-primary)",
            lineHeight: 1.3,
          }}
        >
          {label}
        </p>
        {description && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 13,
              color: selected ? "var(--accent-soft)" : "var(--text-secondary)",
              lineHeight: 1.3,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Check indicator */}
      {multiSelect && (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${selected ? "var(--accent-primary)" : "var(--border-soft)"}`,
            background: selected ? "var(--accent-primary)" : "transparent",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          {selected && (
            <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
              <path
                d="M1 4L4.5 7.5L11 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}

      {/* Single select radio dot */}
      {!multiSelect && (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px solid ${selected ? "var(--accent-primary)" : "var(--border-soft)"}`,
            background: selected ? "var(--accent-primary)" : "transparent",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
        >
          {selected && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "white",
              }}
            />
          )}
        </div>
      )}
    </button>
  );
}
