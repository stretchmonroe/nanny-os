"use client";

import { useEffect, useState } from "react";

interface WelcomeSplashProps {
  onEnter: () => void;
}

export function WelcomeSplash({ onEnter }: WelcomeSplashProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #FFF0E8 0%, #FFF8F3 50%, #F0F5FF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        maxWidth: 480,
        margin: "0 auto",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
      }}
    >
      {/* Logo mark */}
      <div
        className="animate-pop-in"
        style={{
          width: 96,
          height: 96,
          borderRadius: 28,
          background: "linear-gradient(135deg, #FF7B54, #FFB085)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          marginBottom: 32,
          boxShadow: "0 12px 40px rgba(255, 123, 84, 0.35)",
        }}
      >
        ☀️
      </div>

      {/* Wordmark */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1
          className="animate-fade-slide-up"
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "var(--text-primary)",
            margin: "0 0 12px",
            letterSpacing: "-0.5px",
            opacity: 0,
            animationDelay: "150ms",
          }}
        >
          Nanny OS
        </h1>
        <p
          className="animate-fade-slide-up"
          style={{
            fontSize: 17,
            color: "var(--text-secondary)",
            margin: 0,
            lineHeight: 1.5,
            opacity: 0,
            animationDelay: "250ms",
          }}
        >
          Personalized care, crafted<br />for your little one.
        </p>
      </div>

      {/* Feature pills */}
      <div
        className="animate-fade-slide-up"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
          marginBottom: 52,
          opacity: 0,
          animationDelay: "350ms",
        }}
      >
        {[
          { emoji: "🎯", text: "Tailored activities" },
          { emoji: "🧠", text: "AI-powered" },
          { emoji: "💛", text: "Child-centered" },
          { emoji: "🌱", text: "Montessori-friendly" },
        ].map(({ emoji, text }) => (
          <span
            key={text}
            style={{
              background: "white",
              border: "1.5px solid var(--border-soft)",
              borderRadius: 99,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <span>{emoji}</span> {text}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div
        className="animate-fade-slide-up"
        style={{ width: "100%", opacity: 0, animationDelay: "450ms" }}
      >
        <button className="btn-primary" onClick={onEnter}>
          Meet Your Little One →
        </button>
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-light)",
            marginTop: 14,
          }}
        >
          Takes about 2 minutes · No account needed
        </p>
      </div>
    </div>
  );
}
