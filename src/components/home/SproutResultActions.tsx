"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Share2, ShieldCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIGS = [
  { id: "save",    icon: Bookmark,    label: "Save",      doneLabel: "Saved",         doneStyle: "text-amber-500" },
  { id: "share",   icon: Share2,      label: "Share",     doneLabel: "Sent to Sofia", doneStyle: "text-trust"     },
  { id: "approve", icon: ShieldCheck, label: "Approve",   doneLabel: "Approved",      doneStyle: "text-sage"      },
  { id: "journal", icon: BookOpen,    label: "Journal",   doneLabel: "Journalled",    doneStyle: "text-lavender"  },
] as const;

interface Props {
  resetKey: string;
}

export default function SproutResultActions({ resetKey }: Props) {
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => { setDone(new Set()); }, [resetKey]);

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div
      className="flex items-center gap-1.5 px-5 py-4 border-t shrink-0"
      style={{ borderColor: "var(--border-soft)" }}
    >
      {CONFIGS.map(({ id, icon: Icon, label, doneLabel, doneStyle }) => {
        const active = done.has(id);
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.86 }}
            onClick={() => toggle(id)}
            animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl"
            style={{ background: "var(--surface-raised)" }}
          >
            <Icon
              size={16}
              strokeWidth={active ? 2.2 : 1.7}
              className={cn("transition-colors duration-200", active ? doneStyle : "text-muted-foreground/45")}
            />
            <span className={cn(
              "text-[9px] font-bold tracking-wide transition-colors duration-200",
              active ? doneStyle : "text-muted-foreground/35"
            )}>
              {active ? doneLabel : label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
