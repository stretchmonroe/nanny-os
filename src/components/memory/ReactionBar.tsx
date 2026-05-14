"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MomentReaction } from "@/lib/data/demo";

const EMOJIS = ["❤️", "🥹", "😂", "✨"] as const;

interface Props {
  initialReactions?: MomentReaction[];
  className?: string;
}

export default function ReactionBar({ initialReactions = [], className }: Props) {
  const [reactions, setReactions] = useState<MomentReaction[]>(() => {
    const map = new Map<string, ("nanny" | "parent")[]>(EMOJIS.map((e) => [e, []]));
    initialReactions.forEach((r) => map.set(r.emoji, [...r.authors]));
    return EMOJIS.map((emoji) => ({ emoji, authors: map.get(emoji) ?? [] }));
  });

  function toggle(emoji: string) {
    setReactions((prev) =>
      prev.map((r) => {
        if (r.emoji !== emoji) return r;
        const hasMe = r.authors.includes("nanny");
        return { ...r, authors: hasMe ? r.authors.filter((a) => a !== "nanny") : [...r.authors, "nanny"] };
      })
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {reactions.map(({ emoji, authors }) => {
        const count = authors.length;
        const mine = authors.includes("nanny");
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] border transition-all duration-150 active:scale-[0.94]",
              mine
                ? "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200"
                : "bg-transparent border-border/50 text-foreground/60"
            )}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className="text-[11px] font-semibold tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
