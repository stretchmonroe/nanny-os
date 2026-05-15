"use client";

import { useEffect, useState } from "react";

interface ChatBubbleProps {
  message: string;
  followUp?: string;
  animationKey: string;
}

export function ChatBubble({ message, followUp, animationKey }: ChatBubbleProps) {
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    setShowFollowUp(false);
    if (followUp) {
      const t = setTimeout(() => setShowFollowUp(true), 800);
      return () => clearTimeout(t);
    }
  }, [animationKey, followUp]);

  const lines = message.split("\n").filter(Boolean);

  return (
    <div className="px-6 pt-4 pb-2">
      {/* Avatar */}
      <div className="flex items-end gap-3 mb-2">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FF7B54, #FFB085)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(255, 123, 84, 0.3)",
          }}
        >
          ☀️
        </div>
        <div
          key={animationKey}
          className="animate-fade-slide-in"
          style={{
            background: "white",
            borderRadius: "18px 18px 18px 4px",
            padding: "14px 16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            maxWidth: "calc(100% - 56px)",
          }}
        >
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "var(--text-primary)",
                margin: i > 0 ? "6px 0 0" : 0,
                fontWeight: i === 0 && lines.length > 1 ? 400 : 400,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Follow-up bubble */}
      {followUp && showFollowUp && (
        <div
          className="animate-fade-slide-in"
          style={{ paddingLeft: 52 }}
        >
          <div
            style={{
              background: "var(--accent-light)",
              borderRadius: "12px 12px 12px 4px",
              padding: "10px 14px",
              display: "inline-block",
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "var(--accent-primary)",
                fontWeight: 500,
                margin: 0,
              }}
            >
              {followUp}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="px-6 py-3">
      <div className="flex items-end gap-3">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FF7B54, #FFB085)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          ☀️
        </div>
        <div
          style={{
            background: "white",
            borderRadius: "18px 18px 18px 4px",
            padding: "14px 18px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            display: "flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <span className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-soft)", display: "inline-block" }} />
          <span className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-soft)", display: "inline-block" }} />
          <span className="typing-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-soft)", display: "inline-block" }} />
        </div>
      </div>
    </div>
  );
}
