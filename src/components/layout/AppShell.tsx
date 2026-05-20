"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import GlobalFAB from "./GlobalFAB";
import GlobalNav from "./GlobalNav";

const HIDDEN_ROUTES = ["/onboarding", "/invite"];

export default function AppShell() {
  const pathname = usePathname();
  const hide = HIDDEN_ROUTES.some(prefix => pathname?.startsWith(prefix));
  if (hide) return null;
  return (
    <>
      <GlobalNav />
      <BottomNav />
      <GlobalFAB />
    </>
  );
}
