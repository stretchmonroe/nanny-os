"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { demoChildren } from "@/lib/data/demo";
import { cn } from "@/lib/utils";

interface Props {
  open:          boolean;
  activeChildId: string;
  onSelect(id: string): void;
  onClose():     void;
}

export default function ChildSwitcherSheet({ open, activeChildId, onSelect, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="switcher-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            key="switcher-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-md mx-auto rounded-t-[2rem] px-5 pt-5 pb-12"
            style={{ background: "var(--surface-card)" }}
          >
            {/* Handle */}
            <div
              className="w-9 h-1 rounded-full mx-auto mb-5"
              style={{ background: "var(--border-medium)" }}
            />

            {/* Header row */}
            <div className="flex items-center justify-between mb-5 px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/35">
                Who are you with today?
              </p>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.06)" }}
              >
                <X size={12} strokeWidth={2.2} className="text-foreground/40" />
              </button>
            </div>

            {/* Children */}
            <div className="space-y-2.5">
              {demoChildren.map((c, i) => {
                const isActive = c.id === activeChildId;
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onSelect(c.id); onClose(); }}
                    className={cn(
                      "w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-left transition-all",
                    )}
                    style={{
                      background: isActive
                        ? `linear-gradient(145deg, ${c.avatarFrom}28 0%, var(--surface-card) 65%)`
                        : "var(--surface-raised)",
                      border: isActive
                        ? `1.5px solid ${c.avatarTo}40`
                        : "1px solid transparent",
                      boxShadow: isActive ? "var(--shadow-card)" : "none",
                    }}
                  >
                    {/* Emoji avatar */}
                    <div
                      className="w-[56px] h-[56px] rounded-[1.1rem] flex items-center justify-center text-[28px] shrink-0"
                      style={{
                        background: isActive
                          ? `linear-gradient(145deg, ${c.avatarFrom}, ${c.avatarTo})`
                          : "var(--surface-card)",
                        boxShadow: isActive ? "var(--shadow-card)" : "none",
                      }}
                    >
                      {c.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-[16px] font-bold leading-none",
                          isActive ? "text-foreground" : "text-foreground/55"
                        )}
                      >
                        {c.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground/45 mt-1.5 leading-none">
                        {c.age}
                      </p>
                      <p className="text-[12px] text-muted-foreground/35 mt-0.5 leading-none">
                        {c.mood} {c.moodLabel}
                      </p>
                    </div>

                    {/* Active checkmark */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", damping: 22, stiffness: 380 }}
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "var(--sage-light)" }}
                        >
                          <Check size={12} strokeWidth={2.5} style={{ color: "var(--sage)" }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}

              {/* Add a child — future */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-left transition-all active:scale-[0.98] border-dashed border-[1.5px]"
                style={{ borderColor: "var(--border-medium)", background: "transparent" }}
              >
                <div
                  className="w-[56px] h-[56px] rounded-[1.1rem] flex items-center justify-center shrink-0"
                  style={{ background: "var(--surface-raised)" }}
                >
                  <Plus size={18} strokeWidth={1.5} className="text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-foreground/45">
                    Add a child
                  </p>
                  <p className="text-[12px] text-muted-foreground/30 mt-0.5">
                    Add a sibling to your family
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
