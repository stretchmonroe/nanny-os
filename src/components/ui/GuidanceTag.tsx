"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { guidanceFrameworks } from "@/lib/ai/guidance";
import type { GuidanceSource } from "@/lib/ai/guidance";

const colorMap = {
  sage: {
    pill: "bg-sage-light text-sage dark:bg-sage-light/20 dark:text-sage-muted border-sage-light",
    panel: "bg-sage-light/60 dark:bg-sage-light/10 border-sage-light",
    icon: "text-sage dark:text-sage-muted",
  },
  sky: {
    pill: "bg-trust-light text-trust dark:bg-trust-light/15 dark:text-trust-muted border-trust-light",
    panel: "bg-trust-light/60 dark:bg-trust-light/10 border-trust-light",
    icon: "text-trust dark:text-trust-muted",
  },
  teal: {
    pill: "bg-sage-light text-sage dark:bg-sage-light/15 dark:text-sage-muted border-sage-light",
    panel: "bg-sage-light/60 dark:bg-sage-light/10 border-sage-light",
    icon: "text-sage dark:text-sage-muted",
  },
  stone: {
    pill: "bg-muted text-muted-foreground border-border",
    panel: "bg-muted/60 border-border",
    icon: "text-muted-foreground",
  },
};

interface Props {
  source: GuidanceSource;
  /** "sm" (default) for inline use; "xs" for nested/secondary */
  size?: "sm" | "xs";
  /** When true, disables the tap-to-expand panel */
  static?: boolean;
  className?: string;
}

export default function GuidanceTag({ source, size = "sm", static: isStatic = false, className }: Props) {
  const [open, setOpen] = useState(false);

  const fw = guidanceFrameworks[source] ?? guidanceFrameworks["General developmental practice"];
  const c = colorMap[fw.color];

  const pill = (
    <button
      onClick={isStatic ? undefined : () => setOpen((v) => !v)}
      className={cn(
        "inline-flex items-center gap-1 border rounded-full font-semibold transition-opacity active:opacity-70",
        size === "xs" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1",
        c.pill,
        isStatic && "cursor-default",
        className,
      )}
    >
      <ShieldCheck size={size === "xs" ? 9 : 10} strokeWidth={2} className={c.icon} />
      {fw.label}
    </button>
  );

  if (isStatic) return pill;

  return (
    <span className="inline-block">
      {pill}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              "mt-2 rounded-2xl border px-4 py-3.5",
              c.panel,
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-[11px] font-bold text-foreground/80">{fw.label}</p>
                <p className="text-[9px] font-semibold text-muted-foreground/45 uppercase tracking-widest mt-0.5">
                  {fw.ageRange}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="shrink-0 active:opacity-70 mt-0.5">
                <X size={11} className="text-muted-foreground" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
              {fw.description}
            </p>
            {fw.domains.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {fw.domains.map(d => (
                  <span key={d} className="text-[9px] font-semibold text-muted-foreground/50 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                    {d}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground/55 leading-relaxed italic">
              {fw.disclaimer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
