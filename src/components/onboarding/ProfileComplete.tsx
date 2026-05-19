"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnkurWordmark from "@/components/brand/AnkurWordmark";
import type { ChildProfile } from "@/lib/onboarding-flow";

interface ProfileCompleteProps {
  profile: ChildProfile;
}

const FOCUS_LABELS: Record<string, string> = {
  creativity: "Creativity",
  "social-skills": "Social skills",
  language: "Language",
  "motor-skills": "Movement",
  focus: "Focus",
  independence: "Independence",
  curiosity: "Curiosity",
  calm: "Calm",
};

const ACTIVITY_LABELS: Record<string, string> = {
  "arts-crafts": "Arts & crafts",
  "building-blocks": "Building",
  "music-dance": "Music & dance",
  "pretend-play": "Pretend play",
  "books-stories": "Books",
  "outdoor-play": "Outdoors",
  puzzles: "Puzzles",
  "water-play": "Water play",
  animals: "Animals",
  cooking: "Kitchen helper",
};

export function ProfileComplete({ profile }: ProfileCompleteProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
        const data = await res.json();
        setSummary(data.summary || "");
      } catch {
        setSummary(`${profile.name} sounds like an amazing little person! We've saved their profile and can't wait to suggest activities tailored just for them. 🌟`);
      } finally {
        setLoading(false);
        setTimeout(() => setShowContent(true), 100);
      }
    }
    fetchSummary();
  }, [profile]);

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          gap: 20,
        }}
      >
        {/* Spinner */}
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "3px solid var(--accent-light)",
              borderTopColor: "var(--accent-primary)",
              animation: "spin 0.9s linear infinite",
            }}
          />
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ✨
          </span>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Building {profile.name}&apos;s profile…
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>
            Personalizing everything just for them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={showContent ? "animate-fade-slide-up" : ""}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "24px 24px 40px",
        gap: 20,
        opacity: showContent ? undefined : 0,
      }}
    >
      {/* Hero — Ankur brand teal */}
      <div
        style={{
          background: "linear-gradient(145deg, #2A6965 0%, #3D8480 100%)",
          borderRadius: 24,
          padding: "32px 24px 28px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(42, 105, 101, 0.30)",
        }}
      >
        {/* Wordmark on dark teal */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, opacity: 0.92 }}>
          <AnkurWordmark width={160} priority />
        </div>
        <div
          style={{
            width: 48,
            height: 2,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 2,
            margin: "0 auto 20px",
          }}
        />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "white", margin: "0 0 8px", lineHeight: 1.3 }}>
          {profile.name}&apos;s profile is ready
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>
          Personalized care, growing together
        </p>
      </div>

      {/* AI Summary */}
      {summary && (
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "20px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2A6965, #3D8480)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              ✦
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
              Sunny&apos;s take
            </span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-primary)", margin: 0 }}>
            {summary}
          </p>
        </div>
      )}

      {/* Focus Areas */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "20px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Focus Areas
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {profile.developmentalFocus.map((f) => (
            <span
              key={f}
              style={{
                background: "var(--accent-light)",
                color: "var(--accent-primary)",
                borderRadius: 99,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {FOCUS_LABELS[f] || f}
            </span>
          ))}
        </div>
      </div>

      {/* Favorite Activities */}
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "20px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {profile.name} Loves
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {profile.favoriteActivities.map((a) => (
            <span
              key={a}
              style={{
                background: "#F0F9FF",
                color: "#0EA5E9",
                borderRadius: 99,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {ACTIVITY_LABELS[a] || a}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        className="btn-brand"
        style={{ marginTop: 4 }}
        onClick={() => {
          sessionStorage.setItem("nannyos_profile", JSON.stringify(profile));
          router.push("/activities");
        }}
      >
        Start Exploring →
      </button>
    </div>
  );
}
