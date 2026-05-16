"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ONBOARDING_STEPS, TOTAL_STEPS, type ChildProfile } from "@/lib/onboarding-flow";
import { ProgressBar } from "./ProgressBar";
import { ChatBubble, TypingIndicator } from "./ChatBubble";
import { OptionCard } from "./OptionCard";
import { ProfileComplete } from "./ProfileComplete";
import { WelcomeSplash } from "./WelcomeSplash";

type AnswerValue = string | string[];

const EMPTY_PROFILE: Partial<ChildProfile> = {};

export function OnboardingFlow() {
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [profile, setProfile] = useState<Partial<ChildProfile>>(EMPTY_PROFILE);
  const [answer, setAnswer] = useState<AnswerValue>("");
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [complete, setComplete] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const textInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentStep = ONBOARDING_STEPS[stepIndex];

  // Simulate AI typing then reveal input
  const showStep = useCallback(() => {
    setShowInput(false);
    setIsTyping(true);
    setAnimKey((k) => k + 1);
    const delay = currentStep.followUp ? 1000 : 700;
    const t = setTimeout(() => {
      setIsTyping(false);
      setShowInput(true);
      if (currentStep.type === "text-input") {
        setTimeout(() => textInputRef.current?.focus(), 100);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [currentStep]);

  useEffect(() => {
    const cleanup = showStep();
    return cleanup;
  }, [stepIndex, showStep]);

  // Scroll to bottom when content updates
  useEffect(() => {
    if (showInput) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  }, [showInput]);

  const canProceed = () => {
    const minSelect = currentStep.minSelect ?? 1;
    if (Array.isArray(answer)) {
      return answer.length >= minSelect;
    }
    if (minSelect === 0) return true;
    if (!answer) return false;
    return answer.toString().trim().length > 0;
  };

  const handleNext = () => {
    if (!canProceed()) return;

    const value = Array.isArray(answer)
      ? answer
      : answer
      ? answer.toString().trim()
      : [];

    const updated = { ...profile, [currentStep.field]: value };
    setProfile(updated);
    setAnswer("");

    if (stepIndex + 1 >= TOTAL_STEPS) {
      setComplete(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed()) {
      handleNext();
    }
  };

  const toggleOption = (id: string) => {
    if (currentStep.type === "single-select") {
      setAnswer(id);
    } else {
      // multi-select
      const current = Array.isArray(answer) ? answer : [];
      if (current.includes(id)) {
        setAnswer(current.filter((v) => v !== id));
      } else {
        const max = currentStep.maxSelect ?? 10;
        if (current.length < max) {
          setAnswer([...current, id]);
        }
      }
    }
  };

  if (!started) {
    return <WelcomeSplash onEnter={() => setStarted(true)} />;
  }

  if (complete && profile.name) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--bg-warm)",
          display: "flex",
          flexDirection: "column",
          maxWidth: 480,
          margin: "0 auto",
          overflowY: "auto",
        }}
        className="scrollbar-hide"
      >
        <ProfileComplete profile={profile as ChildProfile} />
      </div>
    );
  }

  const messageText = currentStep.message(profile);
  const selectedArr = Array.isArray(answer) ? answer : answer ? [answer] : [];

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
      {/* Progress */}
      <ProgressBar current={stepIndex + 1} total={TOTAL_STEPS} />

      {/* Scrollable chat area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          paddingBottom: 180,
        }}
        className="scrollbar-hide"
      >
        {/* Chat bubble */}
        {isTyping ? (
          <TypingIndicator />
        ) : (
          <ChatBubble
            message={messageText}
            followUp={currentStep.followUp}
            animationKey={String(animKey)}
          />
        )}

        {/* Input area */}
        {showInput && (
          <div className="px-4" style={{ marginTop: 8 }}>
            {currentStep.type === "text-input" && (
              <div className="animate-fade-slide-up" style={{ opacity: 0 }}>
                <input
                  ref={textInputRef}
                  type="text"
                  value={answer as string}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentStep.placeholder || "Type here…"}
                  style={{
                    width: "100%",
                    padding: "16px 18px",
                    fontSize: 16,
                    fontWeight: 500,
                    border: "2px solid var(--border-soft)",
                    borderRadius: 16,
                    background: "white",
                    color: "var(--text-primary)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
            )}

            {(currentStep.type === "single-select" || currentStep.type === "multi-select") &&
              currentStep.options && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {currentStep.type === "multi-select" && currentStep.maxSelect && (
                    <p
                      className="animate-fade-slide-up"
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        margin: "0 0 2px 2px",
                        opacity: 0,
                        animationDelay: "50ms",
                      }}
                    >
                      Select up to {currentStep.maxSelect}
                      {selectedArr.length > 0 && (
                        <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                          {" "}· {selectedArr.length} chosen
                        </span>
                      )}
                    </p>
                  )}
                  {currentStep.options.map((opt, i) => (
                    <OptionCard
                      key={opt.id}
                      emoji={opt.emoji}
                      label={opt.label}
                      description={opt.description}
                      selected={selectedArr.includes(opt.id)}
                      onSelect={() => toggleOption(opt.id)}
                      multiSelect={currentStep.type === "multi-select"}
                      animDelay={i * 55}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Sticky CTA */}
      {showInput && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            maxWidth: 480,
            padding: "16px 24px 32px",
            background: "linear-gradient(to top, var(--bg-warm) 75%, transparent)",
          }}
        >
          <button
            className="btn-primary animate-fade-slide-up"
            style={{ opacity: 0, animationDelay: "200ms" }}
            disabled={!canProceed()}
            onClick={handleNext}
          >
            {stepIndex + 1 === TOTAL_STEPS ? "Create Profile ✨" : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}
