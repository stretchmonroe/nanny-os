"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

// Prevent React Strict Mode double-invoke from firing two navigations.
let _navigating = false;

const PUBLIC = ["/onboarding"];

function isPublic(path: string) {
  return PUBLIC.some((p) => path.startsWith(p));
}

export function useAuthInit() {
  const pathname   = usePathname();
  const setAuthReady = useAppStore((s) => s.setAuthReady);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        setAuthReady(true);
        if (!isPublic(pathname) && !_navigating) {
          _navigating = true;
          console.log("[auth] no session → /onboarding");
          window.location.href = "/onboarding";
        }
        return;
      }

      console.log("[auth] session ok →", session.user.id);
      setAuthReady(true);

      if ((pathname === "/" || isPublic(pathname)) && !_navigating) {
        _navigating = true;
        console.log("[auth] authenticated on public route → /home");
        window.location.href = "/home";
      }
    }

    check();
    return () => { cancelled = true; };
  // Re-run only when the route changes (pathname dep is intentional).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("[auth] onAuthStateChange:", event);
      if (event === "SIGNED_IN") {
        _navigating = false; // reset so the next check can navigate
      }
    });
    return () => subscription.unsubscribe();
  }, []);
}
