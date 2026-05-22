"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { guidanceFrameworks } from "@/lib/ai/guidance";
import type { GuidanceSource } from "@/lib/ai/guidance";

const colorMap = {
  emerald: {
    pill: "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/35",
    panel: "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
    icon: "text-emerald-500 dark:text-emerald-400",
  },
  sky: {
    pill: "bg-sky-50 dark:bg-sky-950/25 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-900/35",
    panel: "bg-sky-50/80 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30",
    icon: "text-sky-500 dark:text-sky-400",
  },
  teal: {
    pill: "bg-teal-50 dark:bg-teal-950/25 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/35",
    panel: "bg-teal-50/80 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30",
    icon: "text-teal-500 dark:text-teal-400",
  },
  stone: {
    pill: "bg-stone-100 dark:bg-stone-800/40 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700/30",
    panel: "bg-stone-50/80 dark:bg-stone-900/20 border-stone-200 dark:border-stone-700/30",
    icon: "text-stone-500 dark:text-stone-400",
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
              <p className="text-[11px] font-bold text-foreground/80">{fw.label}</p>
              <button onClick={() => setOpen(false)} className="shrink-0 active:opacity-70 mt-0.5">
                <X size={11} className="text-muted-foreground" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
              {fw.description}
            </p>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
              {fw.disclaimer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
