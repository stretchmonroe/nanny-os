"use client";

import { useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

// Prevent Strict Mode double-invoke from firing two navigations.
let _navigating = false;

const PUBLIC = ["/onboarding"];

function isPublic(path: string) {
  return PUBLIC.some((p) => path.startsWith(p));
}

export function useAuthInit() {
  const pathname     = usePathname();
  const setAuthReady = useAppStore((s) => s.setAuthReady);

  const check = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

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
      console.log("[auth] authenticated → /home");
      window.location.href = "/home";
    }
  }, [pathname, setAuthReady]);

  // Run on mount and whenever the route changes.
  useEffect(() => {
    check();
  }, [check]);

  // After sign-in, reset the guard and re-run so the redirect fires.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("[auth] event:", event);
      if (event === "SIGNED_IN") {
        _navigating = false;
        check();
      }
    });
    return () => subscription.unsubscribe();
  }, [check]);
}
