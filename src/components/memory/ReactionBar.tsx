"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toggleReaction } from "@/lib/supabase/reactions";
import type { MomentReaction } from "@/lib/data/demo";

const REACTIONS = ["❤️", "🥹", "👏"] as const;
type Emoji = (typeof REACTIONS)[number];

interface Props {
  initialReactions?: MomentReaction[];
  momentId?: string;
  className?: string;
}

export default function ReactionBar({ initialReactions = [], momentId, className }: Props) {
  const [map, setMap] = useState<Record<Emoji, ("nanny" | "parent")[]>>(() => {
    const seed = {} as Record<Emoji, ("nanny" | "parent")[]>;
    REACTIONS.forEach((e) => { seed[e] = []; });
    initialReactions.forEach((r) => {
      const e = r.emoji as Emoji;
      if (e in seed) seed[e] = [...r.authors];
    });
    return seed;
  });

  const [popping,  setPopping]  = useState<Emoji | null>(null);
  const [popCount, setPopCount] = useState<Record<Emoji, number>>({ "❤️": 0, "🥹": 0, "👏": 0 });

  function toggle(emoji: Emoji) {
    const alreadyMine = map[emoji].includes("nanny");
    setMap((prev) => ({
      ...prev,
      [emoji]: alreadyMine
        ? prev[emoji].filter((a) => a !== "nanny")
        : [...prev[emoji], "nanny"],
    }));
    if (!alreadyMine) {
      setPopping(emoji);
      setPopCount((prev) => ({ ...prev, [emoji]: prev[emoji] + 1 }));
      setTimeout(() => setPopping(null), 700);
    }
    if (momentId) toggleReaction(momentId, emoji, "nanny");
  }

  const reactors = [...new Set(Object.values(map).flat())];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {REACTIONS.map((emoji) => {
        const authors = map[emoji];
        const count   = authors.length;
        const mine    = authors.includes("nanny");
        const isPop   = popping === emoji;

        return (
          <div key={emoji} className="relative">
            {/* Floating +1 on new reaction */}
            <AnimatePresence>
              {isPop && (
                <motion.span
                  key={`float-${popCount[emoji]}`}
                  initial={{ opacity: 1, y: 0, scale: 0.85 }}
                  animate={{ opacity: 0, y: -22, scale: 1.1 }}
                  exit={{}}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-500 pointer-events-none select-none z-10 whitespace-nowrap"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => toggle(emoji)}
              animate={isPop ? { scale: [1, 1.45, 0.85, 1.08, 1] } : { scale: 1 }}
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border transition-colors duration-200 select-none",
                count > 0 ? "px-2.5 py-1.5" : "px-2 py-1.5",
                mine
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/30"
                  : count > 0
                  ? "bg-white/60 dark:bg-white/5 border-border/40"
                  : "border-border/20 text-foreground/30 hover:border-border/45 hover:text-foreground/55"
              )}
            >
              <span className="text-[14px] leading-none">{emoji}</span>
              <AnimatePresence mode="popLayout">
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.16 }}
                    className="text-[11px] font-semibold tabular-nums text-foreground/50 overflow-hidden"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        );
      })}

      {/* Who's been here — colored dots */}
      {reactors.length > 0 && (
        <div className="flex items-center -space-x-0.5 ml-1">
          {reactors.map((author) => (
            <div
              key={author}
              className={cn(
                "w-3.5 h-3.5 rounded-full ring-[1.5px] ring-background",
                author === "nanny" ? "bg-amber-400" : "bg-rose-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
