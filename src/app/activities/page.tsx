"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChildProfile } from "@/lib/onboarding-flow";
import type { Activity, TimeWindow } from "@/lib/activities";
import { TIME_WINDOW_META, TIME_WINDOW_ORDER } from "@/lib/activities";
import { TimeWindowSection } from "@/components/activities/TimeWindowSection";
import { ActivitiesLoadingSkeleton } from "@/components/activities/ActivitiesLoadingSkeleton";

type Status = "loading" | "loaded" | "error";

export default function ActivitiesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [swappingWindow, setSwappingWindow] = useState<TimeWindow | null>(null);

  const fetchActivities = useCallback(async (prof: ChildProfile) => {
    setStatus("loading");
    setActivities([]);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: prof }),
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
    try {
      const raw = sessionStorage.getItem("nannyos_profile");
      if (!raw) {
        router.push("/onboarding");
        return;
      }
      const prof: ChildProfile = JSON.parse(raw);
      setProfile(prof);
      fetchActivities(prof);
    } catch {
      router.push("/onboarding");
    }
  }, [router, fetchActivities]);

  const handleSwap = async (window: TimeWindow) => {
    if (!profile || swappingWindow) return;
    setSwappingWindow(window);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, swapWindow: window }),
      });
      const data = await res.json();
      if (!res.ok || !data.activity) throw new Error(data.error || "Failed");
      setActivities((prev) =>
        prev.map((a) => (a.timeWindow === window ? data.activity : a))
      );
    } catch {
      // Silently fail — keep the current card
    } finally {
      setSwappingWindow(null);
    }
  };

  const handleNewPlan = () => {
    if (profile) fetchActivities(profile);
  };

  return (
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
          borderBottom: status === "loaded" ? "1.5px solid var(--border-soft)" : "none",
        }}
      >
        {/* Sunny avatar */}
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
            boxShadow: "0 3px 10px rgba(255, 123, 84, 0.25)",
          }}
        >
          ☀️
        </div>

        {/* Title */}
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
            {profile ? `${profile.name}'s Day` : "Today's Activities"}
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            5 flexible activity windows
          </p>
        </div>

        {/* New plan button */}
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

      {/* Content area */}
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-hide">
        {status === "loading" && (
          <ActivitiesLoadingSkeleton childName={profile?.name} />
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
                We couldn&apos;t generate activities just now. Let&apos;s try again.
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
              padding: "20px 20px 60px",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {TIME_WINDOW_ORDER.map((windowId, i) => {
              const activity = activities.find((a) => a.timeWindow === windowId);
              return (
                <TimeWindowSection
                  key={windowId}
                  windowId={windowId}
                  meta={TIME_WINDOW_META[windowId]}
                  activity={activity}
                  isSwapping={swappingWindow === windowId}
                  anySwapping={Boolean(swappingWindow)}
                  onSwap={() => handleSwap(windowId)}
                  animDelay={i * 80}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
