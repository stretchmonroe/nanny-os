"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthorType = "nanny" | "parent" | "ai";

const cfg = {
  nanny:  { name: "Elena",  initial: "E", circleBg: "bg-amber-100 dark:bg-amber-900/50",   circleText: "text-amber-700 dark:text-amber-300"  },
  parent: { name: "Sofia",  initial: "S", circleBg: "bg-rose-100 dark:bg-rose-900/40",     circleText: "text-rose-600 dark:text-rose-300"    },
  ai:     { name: "Claude", initial: null, circleBg: "bg-violet-100 dark:bg-violet-900/30", circleText: "text-violet-600 dark:text-violet-400" },
} as const;

interface Props {
  author: AuthorType;
  time?: string;
  /** "inline" = circle + name + time. "dot" = circle only. */
  variant?: "inline" | "dot";
  /** Use on dark/photo backgrounds */
  light?: boolean;
  className?: string;
}

export default function AuthorBadge({ author, time, variant = "inline", light = false, className }: Props) {
  const c = cfg[author];

  const circle = (
    <div className={cn(
      "shrink-0 rounded-full flex items-center justify-center",
      variant === "dot" ? "w-5 h-5" : "w-[18px] h-[18px]",
      light ? "bg-white/20 backdrop-blur-sm" : c.circleBg,
    )}>
      {author === "ai" ? (
        <Sparkles className={cn("w-2.5 h-2.5", light ? "text-white/80" : c.circleText)} strokeWidth={2} />
      ) : (
        <span className={cn("text-[8px] font-bold leading-none", light ? "text-white/90" : c.circleText)}>
          {c.initial}
        </span>
      )}
    </div>
  );

  if (variant === "dot") return circle;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {circle}
      <span className={cn("text-[11px] font-semibold", light ? "text-white/60" : "text-muted-foreground")}>
        {c.name}
        {time && <span className="font-normal opacity-70"> · {time}</span>}
      </span>
    </div>
  );
}
