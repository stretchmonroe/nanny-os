"use client";

import { useEffect, useRef, useState } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface QuickNoteModalProps {
  activityTitle: string;
  initialNote?: string;
  onSave: (note: string) => void;
  onSkip: () => void;
}

export function QuickNoteModal({
  activityTitle,
  initialNote = "",
  onSave,
  onSkip,
}: QuickNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceInput({ continuous: false });

  const isListening = voice.state === "listening";

  // Sync finalised transcript into note field
  useEffect(() => {
    if (voice.transcript) setNote(voice.transcript);
  }, [voice.transcript]);

  // Animate in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    voice.reset();
    onSave(note.trim());
  };

  const handleSkip = () => {
    voice.reset();
    onSkip();
  };

  const toggleVoice = () => {
    if (isListening) {
      voice.stop();
    } else {
      voice.reset();
      setNote("");
      voice.start();
    }
  };

  // While listening, show interim speech as italic placeholder
  const placeholder = isListening
    ? (voice.interim || "Listening…")
    : "A quick thought, anything notable…";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleSkip}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.35)",
          zIndex: 50,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: `translateX(-50%) translateY(${visible ? "0" : "100%"})`,
          width: "100%",
          maxWidth: 480,
          background: "white",
          borderRadius: "24px 24px 0 0",
          padding: "24px 24px 40px",
          zIndex: 51,
          transition: "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 99,
            background: "var(--border-soft)",
            margin: "0 auto 20px",
          }}
        />

        {/* Header */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-light)",
            margin: "0 0 4px",
          }}
        >
          {activityTitle}
        </p>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 18px",
          }}
        >
          How did it go? 🌿
        </h3>

        {/* Text area */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={placeholder}
            rows={4}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--text-primary)",
              background: isListening ? "var(--accent-light)" : "var(--bg-warm)",
              border: `2px solid ${isListening ? "var(--accent-primary)" : "var(--border-soft)"}`,
              borderRadius: 16,
              resize: "none",
              outline: "none",
              transition: "border-color 0.2s, background 0.2s",
              fontFamily: "inherit",
              fontStyle: voice.interim && isListening ? "italic" : "normal",
            }}
          />

          {isListening && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                animation: "pulse-soft 1s infinite",
              }}
            />
          )}
        </div>

        {/* Actions row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {voice.supported && (
            <button
              onClick={toggleVoice}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                border: `2px solid ${isListening ? "var(--accent-primary)" : "var(--border-soft)"}`,
                background: isListening ? "var(--accent-light)" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
                WebkitTapHighlightColor: "transparent",
              }}
              title={isListening ? "Stop listening" : "Voice note"}
            >
              {isListening ? "⏹" : "🎤"}
            </button>
          )}

          <button
            onClick={handleSkip}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              border: "2px solid var(--border-soft)",
              background: "white",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-secondary)",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Skip
          </button>

          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: "13px",
              borderRadius: 14,
              border: "none",
              background: note.trim()
                ? "linear-gradient(135deg, #FF7B54, #FF9A6C)"
                : "var(--border-soft)",
              color: note.trim() ? "white" : "var(--text-light)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: note.trim() ? "0 4px 12px rgba(255, 123, 84, 0.25)" : "none",
              transition: "all 0.2s ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Save note
          </button>
        </div>
      </div>
    </>
  );
}
