"use client";

import { useEffect, useState } from "react";
import AnkurWordmark from "@/components/brand/AnkurWordmark";

interface WelcomeSplashProps {
  onEnter: () => void;
}

const PILLS = [
  { emoji: "🌱", text: "Rooted in care" },
  { emoji: "👨‍👩‍👧", text: "Family collaboration" },
  { emoji: "✨", text: "Thoughtfully intelligent" },
  { emoji: "🏡", text: "Premium experience" },
];

export function WelcomeSplash({ onEnter }: WelcomeSplashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F4EFE8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 28px 56px",
        maxWidth: 480,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.45s ease",
      }}
    >
      {/* Wordmark — hero moment */}
      <div
        className="animate-pop-in"
        style={{ marginBottom: 48, opacity: 0 }}
      >
        <AnkurWordmark width={260} priority />
      </div>

      {/* Feature pills */}
      <div
        className="animate-fade-slide-up"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          marginBottom: 56,
          opacity: 0,
          animationDelay: "200ms",
        }}
      >
        {PILLS.map(({ emoji, text }) => (
          <span
            key={text}
            style={{
              background: "rgba(255,255,255,0.72)",
              border: "1.5px solid rgba(42,105,101,0.12)",
              borderRadius: 99,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: "#3D5550",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 1px 6px rgba(42,105,101,0.07)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span>{emoji}</span> {text}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div
        className="animate-fade-slide-up"
        style={{ width: "100%", opacity: 0, animationDelay: "340ms" }}
      >
        <button className="btn-brand" onClick={onEnter}>
          Begin your story →
        </button>
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "rgba(42,105,101,0.5)",
            marginTop: 14,
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          Takes about 2 minutes · Free to start
        </p>
      </div>
    </div>
  );
}
