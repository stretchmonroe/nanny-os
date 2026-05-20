"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export type AuthorType = "nanny" | "parent" | "ai" | "system";

const cfg = {
  nanny:  { role: "Nanny",  circleBg: "bg-amber-100 dark:bg-amber-900/50",      circleText: "text-amber-700 dark:text-amber-300"  },
  parent: { role: "Parent", circleBg: "bg-rose-100 dark:bg-rose-900/40",        circleText: "text-rose-600 dark:text-rose-300"    },
  ai:     { role: "AI",     circleBg: "bg-lavender-light dark:bg-lavender/20",  circleText: "text-lavender dark:text-lavender"    },
  system: { role: "",       circleBg: "bg-muted",                               circleText: "text-muted-foreground/35"             },
} as const;

interface Props {
  author: AuthorType;
  /** Override the default display name */
  displayName?: string;
  time?: string;
  /** "inline" = circle + name + time. "dot" = circle only. */
  variant?: "inline" | "dot";
  /** Use on dark/photo backgrounds */
  light?: boolean;
  /** Show "Name · Role" — defaults true for inline */
  showRole?: boolean;
  className?: string;
}

export default function AuthorBadge({ author, displayName, time, variant = "inline", light = false, showRole = true, className }: Props) {
  const { memberNames } = useAppStore();
  const c = cfg[author];

  const resolvedName = displayName ?? (
    author === "nanny" ? memberNames.nanny :
    author === "parent" ? memberNames.parent :
    author === "ai" ? "Sprout" : ""
  );
  const resolvedInitial = author === "system" ? "·" : author === "ai" ? null : resolvedName[0]?.toUpperCase() ?? "?";

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
          {resolvedInitial}
        </span>
      )}
    </div>
  );

  if (variant === "dot") return circle;

  const nameLabel = showRole && author !== "ai" && author !== "system"
    ? `${resolvedName} · ${c.role}`
    : resolvedName;

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
