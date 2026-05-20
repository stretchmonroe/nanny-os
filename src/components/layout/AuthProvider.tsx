"use client";

import { useAuthInit } from "@/hooks/useAuthInit";

export default function AuthProvider() {
  useAuthInit();
  return null;
}
