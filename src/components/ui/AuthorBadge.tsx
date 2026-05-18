"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthorType = "nanny" | "parent" | "ai";

const cfg = {
  nanny:  { name: "Elena",  role: "Nanny",  initial: "E", circleBg: "bg-amber-100 dark:bg-amber-900/50",   circleText: "text-amber-700 dark:text-amber-300"  },
  parent: { name: "Sofia",  role: "Parent", initial: "S", circleBg: "bg-rose-100 dark:bg-rose-900/40",     circleText: "text-rose-600 dark:text-rose-300"    },
  ai:     { name: "Claude", role: "AI",     initial: null, circleBg: "bg-lavender-light dark:bg-lavender/20", circleText: "text-lavender dark:text-lavender" },
} as const;

interface Props {
  author: AuthorType;
  time?: string;
  /** "inline" = circle + name + time. "dot" = circle only. */
  variant?: "inline" | "dot";
  /** Use on dark/photo backgrounds */
  light?: boolean;
  /** Show "Name · Role" — defaults true for inline */
  showRole?: boolean;
  className?: string;
}

export default function AuthorBadge({ author, time, variant = "inline", light = false, showRole = true, className }: Props) {
  const c = cfg[author];

  const circle = (
    <div className={cn(
      "shrink-0 rounded-full flex items-center justify-center",
      variant === "dot" ? "w-[22px] h-[22px]" : "w-6 h-6",
      light
        ? "bg-white/20 backdrop-blur-sm ring-1 ring-white/15"
        : c.circleBg,
    )}>
      {author === "ai" ? (
        <Sparkles className={cn("w-3 h-3", light ? "text-white/80" : c.circleText)} strokeWidth={2} />
      ) : (
        <span className={cn("text-[10px] font-bold leading-none", light ? "text-white/90" : c.circleText)}>
          {c.initial}
        </span>
      )}
    </div>
  );

  if (variant === "dot") return circle;

  const nameLabel = showRole && author !== "ai"
    ? `${c.name} · ${c.role}`
    : c.name;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {circle}
      <span className={cn("text-[12px] font-semibold", light ? "text-white/60" : "text-muted-foreground")}>
        {nameLabel}
        {time && <span className="font-normal opacity-60"> · {time}</span>}
      </span>
    </div>
  );
}
