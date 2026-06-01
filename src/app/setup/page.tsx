"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import CreateHomeFlow from "@/components/onboarding/CreateHomeFlow";

export default function SetupPage() {
  const { currentUserRole, activeChild, authReady } = useAppStore();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  // Caregivers cannot manage household setup — send them back to the app shell.
  useEffect(() => {
    if (authReady && currentUserRole === "nanny") {
      router.replace("/home");
    }
  }, [authReady, currentUserRole, router]);

  // completion state — required cards only
  const homeDetailsDone  = currentUserRole !== null;
  const childProfileDone = activeChild !== null;
  const completed = [homeDetailsDone, childProfileDone, false, false, false];
  const doneCount = completed.filter(Boolean).length;

  const cards = [
    {
      id:          "home",
      icon:        "🏡",
      title:       "Home Details",
      description: "Choose your role and connect to a household — the first step to bringing everyone together.",
      required:    true,
      done:        homeDetailsDone,
      onTap:       () => setCreateOpen(true),
    },
    {
      id:          "child",
      icon:        "🌱",
      title:       "Child Profile",
      description: "Add your little one's name and birthdate so every recommendation feels personal.",
      required:    true,
      done:        childProfileDone,
      onTap:       () => setCreateOpen(true),
    },
    {
      id:          "circle",
      icon:        "🤝",
      title:       "Care Circle",
      description: "Invite your nanny, partner, or family — everyone who shows up for them.",
      required:    false,
      done:        false,
      onTap:       () => router.push("/care-circle"),
    },
    {
      id:          "rhythm",
      icon:        "🕐",
      title:       "Daily Rhythm",
      description: "Build a gentle schedule that helps the whole household flow together.",
      required:    false,
      done:        false,
      onTap:       () => router.push("/schedule"),
    },
    {
      id:          "focus",
      icon:        "✨",
      title:       "Growth Focus",
      description: "Choose a developmental area to guide today's suggestions and activities.",
      required:    false,
      done:        false,
      onTap:       () => router.push("/home"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF7F2] dark:bg-surface-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-7">

        {/* Illustration */}
        <div className="flex justify-center mb-7">
          <div className="relative">
            {/* Outer halo */}
            <div
              className="absolute inset-0 rounded-full opacity-40 blur-xl"
              style={{ background: "radial-gradient(circle, #F5DEC8, #FAEDE6)" }}
            />
            {/* Main orb */}
            <div
              className="relative w-[112px] h-[112px] rounded-full flex items-center justify-center text-[54px] shadow-elevated"
              style={{ background: "linear-gradient(135deg, #F5E6D0 0%, #FAEDE6 100%)" }}
            >
              🤱
            </div>
            {/* Decorative */}
            <span className="absolute -top-2 -right-1 text-[18px] select-none">🌿</span>
            <span className="absolute -bottom-2 -left-2 text-[16px] select-none">✨</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h1 className="text-[34px] font-black text-foreground tracking-tight leading-[1.05]">
            Create Your Home
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2.5 leading-relaxed max-w-[270px] mx-auto">
            Your shared place for care, memories, routines, and growth.
          </p>
        </div>

        {/* Progress */}
        <div className="text-center">
          <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-[0.1em] mb-2.5">
            {doneCount} of 5 complete
          </p>
          <div className="flex gap-1.5 justify-center">
            {completed.map((done, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className={cn(
                  "h-1.5 w-11 rounded-full origin-left transition-colors duration-500",
                  done
                    ? "bg-sage"
                    : "bg-black/8 dark:bg-white/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Setup cards ──────────────────────────────────────────────────── */}
      <div className="px-4 pb-28 space-y-3">
        {cards.map((card, i) => {
          const isRequired  = card.required;
          const isDone      = card.done;
          const isCompleted = isDone;

          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.065, duration: 0.38, ease: [0.25, 1, 0.5, 1] }}
              onClick={card.onTap}
              className={cn(
                "w-full text-left rounded-[1.5rem] border p-5 shadow-card active:scale-[0.984] transition-transform",
                isCompleted
                  ? "bg-sage-light/40 dark:bg-sage/8 border-sage-light dark:border-sage/20"
                  : "bg-white dark:bg-surface-card border-border"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon orb */}
                <div className={cn(
                  "w-11 h-11 rounded-[14px] flex items-center justify-center text-[22px] shrink-0",
                  isCompleted
                    ? "bg-sage-light dark:bg-sage/15"
                    : isRequired
                      ? "bg-[#FAEDE6] dark:bg-[#D4694A]/15"
                      : "bg-amber-50 dark:bg-amber-950/30"
                )}>
                  {card.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className={cn(
                      "text-[16px] font-bold leading-snug",
                      isCompleted ? "text-sage" : "text-foreground"
                    )}>
                      {card.title}
                    </p>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-[2px] rounded-full",
                      isRequired
                        ? "bg-[#FAEDE6] text-[#D4694A] dark:bg-[#D4694A]/15 dark:text-[#E89572]"
                        : "bg-surface-raised text-muted-foreground/50"
                    )}>
                      {isRequired ? "Required" : "Recommended"}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>

                  {/* CTA */}
                  <p className={cn(
                    "text-[12px] font-semibold mt-2.5",
                    isCompleted ? "text-sage" : isRequired ? "text-[#D4694A]" : "text-muted-foreground"
                  )}>
                    {isCompleted ? (isRequired ? "Edit →" : "Done ✓") : isRequired ? "Start →" : "Set up →"}
                  </p>
                </div>

                {/* State indicator */}
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center">
                      <Check size={13} strokeWidth={2.5} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface-raised flex items-center justify-center">
                      <ChevronRight size={13} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}

        {/* All done state */}
        {homeDetailsDone && childProfileDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mx-1 mt-1 rounded-[1.5rem] bg-sage-light/60 dark:bg-sage/10 border border-sage-light dark:border-sage/20 px-6 py-5 text-center"
          >
            <p className="text-[22px] mb-2">🌿</p>
            <p className="text-[14px] font-bold text-sage">Your home is set up</p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
              Add your care circle and daily rhythm whenever you&rsquo;re ready.
            </p>
          </motion.div>
        )}
      </div>

      {/* CreateHomeFlow for data entry */}
      <CreateHomeFlow open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
