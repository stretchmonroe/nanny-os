"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export type AttributionActor  = "nanny" | "parent" | "ai" | "system";
export type AttributionAction =
  | "completed"
  | "noted"
  | "approved"
  | "noticed"
  | "scheduled"
  | "logged";

const ACTOR_CFG = {
  nanny:  { circleBg: "bg-amber-100 dark:bg-amber-900/50",      circleText: "text-amber-700 dark:text-amber-300"  },
  parent: { circleBg: "bg-rose-100 dark:bg-rose-900/40",        circleText: "text-rose-600 dark:text-rose-300"   },
  ai:     { circleBg: "bg-lavender-light dark:bg-lavender/20",  circleText: "text-lavender dark:text-lavender"   },
  system: { circleBg: "bg-muted",                               circleText: "text-muted-foreground/35"           },
} as const;

interface Props {
  actor:        AttributionActor;
  action:       AttributionAction;
  displayName?: string;
  className?:   string;
}

export default function AttributionLine({ actor, action, displayName, className }: Props) {
  const { memberNames } = useAppStore();
  const cfg = ACTOR_CFG[actor];
  const name = displayName ?? (
    actor === "nanny" ? memberNames.nanny :
    actor === "parent" ? memberNames.parent :
    actor === "ai" ? "Sprout" : ""
  );
  const initial = actor === "system" ? "·" : actor === "ai" ? null : name[0]?.toUpperCase() ?? "?";

  if (actor === "system") {
    return (
      <p className={cn("text-[10px] font-medium text-muted-foreground/30 italic mb-0.5", className)}>
        {action === "scheduled" ? "On the schedule" : action}
      </p>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 mb-1", className)}>
      <div className={cn("w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0", cfg.circleBg)}>
        {actor === "ai" ? (
          <Sparkles className={cn("w-[8px] h-[8px]", cfg.circleText)} strokeWidth={2.2} />
        ) : (
          <span className={cn("text-[7px] font-bold leading-none", cfg.circleText)}>
            {initial}
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground/50 leading-none">
        {name}
        <span className="font-normal text-muted-foreground/40"> {action}</span>
      </span>
    </div>
  );
}
