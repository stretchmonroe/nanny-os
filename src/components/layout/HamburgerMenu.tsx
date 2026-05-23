"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { LogOut, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import CreateHomeFlow from "@/components/onboarding/CreateHomeFlow";

interface Props {
  open: boolean;
  onClose: () => void;
  showDot: boolean;
}

export default function HamburgerMenu({ open, onClose, showDot }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  async function signOut() {
    onClose();
    await supabase.auth.signOut();
    window.location.href = "/onboarding";
  }

  function openCreate() {
    onClose();
    // small delay so the drawer exits before the flow enters
    setTimeout(() => setCreateOpen(true), 220);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="hmbg-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-[2px]"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              key="hmbg-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[60] w-[280px] bg-surface-card shadow-deep flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-14 pb-5 border-b border-soft">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    Menu
                  </p>
                  <h2 className="text-[22px] font-black text-foreground tracking-tight">
                    Ankur
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 px-3 py-3">
                <button
                  onClick={openCreate}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl active:bg-surface-raised transition-colors text-left"
                >
                  <span className="text-[18px] leading-none">🌱</span>
                  <span className="flex-1 text-[15px] font-semibold text-foreground">
                    Create Your Home
                  </span>
                  {showDot && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                </button>
              </div>

              {/* Footer */}
              <div className="px-3 pb-12 border-t border-soft pt-3">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl active:bg-surface-raised transition-colors text-left"
                >
                  <LogOut size={15} className="text-muted-foreground shrink-0" />
                  <span className="text-[15px] font-semibold text-muted-foreground">
                    Sign out
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateHomeFlow open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
