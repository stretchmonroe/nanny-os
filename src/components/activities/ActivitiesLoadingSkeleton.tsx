"use client";

function SkeletonCard() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: "18px 18px 22px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div
          className="animate-pulse-soft"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "var(--border-soft)",
            flexShrink: 0,
          }}
        />
        <div
          className="animate-pulse-soft"
          style={{
            width: 72,
            height: 22,
            borderRadius: 99,
            background: "var(--border-soft)",
            alignSelf: "center",
            marginLeft: "auto",
          }}
        />
      </div>

      {/* Title */}
      <div
        className="animate-pulse-soft"
        style={{
          height: 18,
          borderRadius: 8,
          background: "var(--border-soft)",
          marginBottom: 8,
          width: "70%",
        }}
      />

      {/* Duration */}
      <div
        className="animate-pulse-soft"
        style={{
          height: 13,
          borderRadius: 6,
          background: "var(--border-soft)",
          marginBottom: 12,
          width: "30%",
        }}
      />

      {/* Purpose lines */}
      <div
        className="animate-pulse-soft"
        style={{
          height: 14,
          borderRadius: 6,
          background: "var(--border-soft)",
          marginBottom: 6,
        }}
      />
      <div
        className="animate-pulse-soft"
        style={{
          height: 14,
          borderRadius: 6,
          background: "var(--border-soft)",
          marginBottom: 14,
          width: "85%",
        }}
      />

      {/* Materials chips */}
      <div style={{ display: "flex", gap: 6 }}>
        {[50, 66, 44].map((w) => (
          <div
            key={w}
            className="animate-pulse-soft"
            style={{
              height: 24,
              width: w,
              borderRadius: 8,
              background: "var(--border-soft)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ActivitiesLoadingSkeletonProps {
  childName?: string;
}

export function ActivitiesLoadingSkeleton({
  childName,
}: ActivitiesLoadingSkeletonProps) {
  return (
    <div style={{ padding: "0 20px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Subtitle */}
      <div style={{ textAlign: "center", paddingTop: 8, paddingBottom: 4 }}>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {childName
            ? `Crafting today's activities for ${childName}…`
            : "Crafting today's activities…"}
        </p>
      </div>

      {/* 5 skeleton cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          {/* Window header skeleton */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              className="animate-pulse-soft"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--border-soft)",
              }}
            />
            <div
              className="animate-pulse-soft"
              style={{
                height: 15,
                width: 120,
                borderRadius: 6,
                background: "var(--border-soft)",
              }}
            />
          </div>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
