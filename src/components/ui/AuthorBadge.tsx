"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthorType = "nanny" | "parent" | "ai";

const cfg = {
  nanny:  { role: "Nanny",  initial: "N", circleBg: "bg-amber-100 dark:bg-amber-900/50",   circleText: "text-amber-700 dark:text-amber-300"  },
  parent: { role: "Parent", initial: "P", circleBg: "bg-rose-100 dark:bg-rose-900/40",     circleText: "text-rose-600 dark:text-rose-300"    },
  ai:     { role: "AI",     initial: null, circleBg: "bg-lavender-light",                   circleText: "text-lavender"                       },
} as const;

interface Props {
  author: AuthorType;
  /** Real display name — overrides generic role label */
  name?: string;
  time?: string;
  variant?: "inline" | "dot";
  light?: boolean;
  showRole?: boolean;
  className?: string;
}

export default function AuthorBadge({ author, name, time, variant = "inline", light = false, showRole = true, className }: Props) {
  const c = cfg[author];

  const initial = name
    ? name.trim()[0].toUpperCase()
    : c.initial;

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
          {initial}
        </span>
      )}
    </div>
  );

  if (variant === "dot") return circle;

  const displayName = name ?? c.role;
  const nameLabel = showRole && author !== "ai" && name
    ? `${name} · ${c.role}`
    : displayName;

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
