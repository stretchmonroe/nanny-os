"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  X, LogOut, Home, Users, Baby, Settings, CreditCard, MessageCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  showDot: boolean;
}

type MenuItem = {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  sub?: string;
  href?: string;
  dot?: boolean;
  dim?: boolean;
};

export default function HamburgerMenu({ open, onClose, showDot }: Props) {
  const router          = useRouter();
  const activeChild     = useAppStore((s) => s.activeChild);
  const currentUserRole = useAppStore((s) => s.currentUserRole);

  const isNanny = currentUserRole === "nanny";

  function nav(href: string) {
    onClose();
    setTimeout(() => router.push(href), 160);
  }

  async function signOut() {
    onClose();
    await supabase.auth.signOut();
    window.location.href = "/onboarding";
  }

  // ── Parent / new-user menu ──────────────────────────────────────────────────
  const parentSections: MenuItem[][] = [
    [
      {
        icon:  Home,
        label: "Create Your Home",
        sub:   showDot ? "Setup incomplete" : "Manage household",
        href:  "/setup",
        dot:   showDot,
      },
      {
        icon:  Baby,
        label: activeChild?.name ?? "Child Profile",
        sub:   activeChild
          ? activeChild.birthDate
            ? new Date(activeChild.birthDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : "Edit profile"
          : "Add a child to get started",
        href:  "/setup",
      },
      {
        icon:  Users,
        label: "Care Circle",
        sub:   "Manage caregivers",
        href:  "/care-circle",
      },
    ],
    [
      { icon: Settings,       label: "Settings",        dim: true },
      { icon: CreditCard,     label: "Subscription",    dim: true },
      { icon: MessageCircle,  label: "Help & Feedback",  dim: true },
    ],
  ];

  // ── Nanny menu — no household admin, no subscription ───────────────────────
  const nannySections: MenuItem[][] = [
    [
      { icon: Settings,      label: "Settings",        dim: true },
      { icon: MessageCircle, label: "Help & Feedback",  dim: true },
    ],
  ];

  const sections = isNanny ? nannySections : parentSections;

  return (
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
            className="fixed left-0 top-0 bottom-0 z-[60] w-[290px] bg-surface-card shadow-deep flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-14 pb-5 border-b border-soft">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-0.5">
                  {isNanny ? "Caregiver" : "Ankur"}
                </p>
                <h2 className="text-[22px] font-black text-foreground tracking-tight leading-tight">
                  {activeChild ? `${activeChild.name}'s Home` : "Your Home"}
                </h2>
                {isNanny && activeChild && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Caregiver access
                  </p>
                )}
                {!isNanny && !activeChild && (
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Set up your household to get started
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform ml-3 shrink-0"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-3">
              {sections.map((section, si) => (
                <div key={si} className={cn("px-3", si > 0 && "mt-1 pt-1 border-t border-soft")}>
                  {section.map((item) => {
                    const Icon     = item.icon;
                    const disabled = !!item.dim;
                    const hasDot   = !!item.dot;

                    return (
                      <button
                        key={item.label}
                        onClick={() => !disabled && item.href && nav(item.href)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-colors",
                          disabled ? "opacity-35 cursor-default" : "active:bg-surface-raised"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          hasDot ? "bg-[#FAEDE6] dark:bg-[#D4694A]/15" : "bg-surface-raised"
                        )}>
                          <Icon
                            size={15}
                            strokeWidth={1.9}
                            className={hasDot ? "text-[#D4694A]" : "text-muted-foreground"}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[14px] font-semibold leading-snug truncate",
                            hasDot ? "text-[#D4694A]" : "text-foreground"
                          )}>
                            {item.label}
                          </p>
                          {item.sub && (
                            <p className="text-[11px] text-muted-foreground leading-tight mt-[1px]">
                              {item.sub}
                            </p>
                          )}
                        </div>

                        {hasDot && <span className="w-2 h-2 rounded-full bg-[#D4694A] shrink-0" />}
                        {disabled && (
                          <span className="text-[10px] text-muted-foreground/40 font-semibold shrink-0">
                            Soon
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 pb-12 pt-3 border-t border-soft">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl active:bg-surface-raised transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center shrink-0">
                  <LogOut size={15} strokeWidth={1.9} className="text-muted-foreground" />
                </div>
                <span className="text-[14px] font-semibold text-muted-foreground">Sign out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
