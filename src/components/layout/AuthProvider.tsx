"use client";

import { useAuthInit } from "@/hooks/useAuthInit";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}
