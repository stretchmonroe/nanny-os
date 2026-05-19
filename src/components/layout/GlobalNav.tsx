"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  X,
  User, Home, Users, Heart,
  UserPlus, Leaf, Star, BookOpen,
  FileDown, Mic, Bell,
  Sparkles, CreditCard, MessageSquare, HelpCircle, Shield,
} from "lucide-react"
import AnkurWordmark from "@/components/brand/AnkurWordmark"
import { child } from "@/lib/data/demo"
import type { LucideIcon } from "lucide-react"

// ── Nav data ───────────────────────────────────────────────────────────────────

interface NavItem { icon: LucideIcon; label: string }

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Account",
    items: [
      { icon: User,  label: "Profile"        },
      { icon: Home,  label: "Household"      },
      { icon: Users, label: "Care circle"    },
      { icon: Heart, label: "Child profiles" },
    ],
  },
  {
    label: "Care",
    items: [
      { icon: UserPlus, label: "Invite caregiver"     },
      { icon: Leaf,     label: "Development settings" },
      { icon: Star,     label: "Activity preferences" },
      { icon: BookOpen, label: "Research history"     },
    ],
  },
  {
    label: "App",
    items: [
      { icon: FileDown, label: "Journal exports" },
      { icon: Mic,      label: "Voice memories"  },
      { icon: Bell,     label: "Notifications"   },
    ],
  },
  {
    label: "Business",
    items: [
      { icon: Sparkles,      label: "Subscription" },
      { icon: CreditCard,    label: "Billing"      },
      { icon: MessageSquare, label: "Feedback"     },
      { icon: HelpCircle,    label: "Help"         },
      { icon: Shield,        label: "Privacy"      },
    ],
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function GlobalNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("open-nav", handler)
    return () => window.removeEventListener("open-nav", handler)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[1.5px]"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            key="nav-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            className="fixed top-0 left-0 bottom-0 z-[100] w-[82vw] max-w-[308px] flex flex-col"
            style={{ background: "var(--surface-card)" }}
          >
            {/* Identity header */}
            <div
              className="px-5 pt-12 pb-5 shrink-0"
              style={{
                background: "linear-gradient(155deg, #EDE4D4 0%, var(--surface-card) 100%)",
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-[1rem] flex items-center justify-center text-[22px] shadow-card ring-[2.5px] ring-[#D4A882]/20"
                  style={{ background: "linear-gradient(135deg, #F5D9A8, #E8A87C)" }}
                >
                  {child.emoji}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: "rgba(0,0,0,0.07)" }}
                  aria-label="Close"
                >
                  <X size={12} strokeWidth={2.2} className="text-foreground/40" />
                </button>
              </div>

              <p className="text-[16px] font-bold text-foreground leading-tight">
                {child.name}&apos;s home
              </p>
              <p className="text-[12px] font-medium text-muted-foreground/45 mt-0.5">
                Elena &middot; Nanny
              </p>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto py-1">
              {SECTIONS.map((section, si) => (
                <div key={section.label} className={si > 0 ? "mt-0.5" : ""}>
                  <p className="px-5 pt-[18px] pb-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground/28">
                    {section.label}
                  </p>
                  {section.items.map(({ icon: Icon, label }) => (
                    <motion.button
                      key={label}
                      whileTap={{ scale: 0.97, x: 2 }}
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center gap-3.5 px-5 py-[10px] text-left"
                    >
                      <Icon
                        size={15}
                        strokeWidth={1.6}
                        className="text-muted-foreground/32 shrink-0"
                      />
                      <span className="text-[13.5px] font-medium text-foreground/68">
                        {label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              ))}

              {/* Brand footer */}
              <div className="px-5 pt-9 pb-10 opacity-[0.16]">
                <AnkurWordmark width={66} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
