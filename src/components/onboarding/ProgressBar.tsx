"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="w-full px-6 pt-5 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>
          Step {current} of {total}
        </span>
        <span style={{ color: "var(--accent-primary)", fontSize: 13, fontWeight: 600 }}>
          {percent}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: "var(--border-soft)",
          overflow: "hidden",
        }}
      >
        <div
          className="progress-fill"
          style={{
            height: "100%",
            width: `${percent}%`,
            borderRadius: 99,
            background: "linear-gradient(90deg, #FF7B54, #FFB085)",
          }}
        />
      </div>
    </div>
  );
}
