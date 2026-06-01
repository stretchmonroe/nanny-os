"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import HamburgerMenu from "./HamburgerMenu";

const HIDE_ON = ["/onboarding"];

export default function TopBar() {
  const pathname   = usePathname();
  const [open, setOpen]             = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const activeChild     = useAppStore((s) => s.activeChild);
  const authReady       = useAppStore((s) => s.authReady);
  const currentUserRole = useAppStore((s) => s.currentUserRole);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  // Only parents (and new users who haven't chosen a role yet) see the setup dot.
  // Nannies cannot do household setup so the dot is never relevant to them.
  const showDot = authReady && hasSession && currentUserRole !== "nanny" && (!activeChild || !currentUserRole);

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center px-4 h-11"
        style={{ background: "var(--surface-header)" }}
      >
        <button
          onClick={() => setOpen(true)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl active:bg-surface-raised transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" strokeWidth={2} />
          {showDot && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4694A] ring-2 ring-[var(--surface-header)]" />
          )}
        </button>
      </header>

      <HamburgerMenu open={open} onClose={() => setOpen(false)} showDot={showDot} />
    </>
  );
}
