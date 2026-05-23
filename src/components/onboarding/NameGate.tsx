"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

export default function NameGate({ open }: { open: boolean }) {
  const [name,   setName]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const { setProfileFullName } = useAppStore();

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!user || !session) { setError("Session expired — please sign out and back in."); setSaving(false); return; }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ full_name: trimmed }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong");
      setSaving(false);
      return;
    }

    setProfileFullName(trimmed);
    setSaving(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="name-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-surface-page flex flex-col items-center justify-center px-8 max-w-md mx-auto"
        >
          <div className="w-full max-w-sm">
            <p className="text-[40px] mb-6">👋</p>
            <h1 className="text-[30px] font-black text-foreground tracking-tight leading-tight mb-2">
              What's your name?
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed mb-8">
              Your name shows on notes and memories you log — so the whole care circle knows who added what.
            </p>

            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && save()}
              placeholder="Your first name"
              className="w-full bg-surface-card border border-border rounded-2xl px-4 py-4 text-[20px] font-semibold text-foreground placeholder:text-muted-foreground/35 outline-none mb-3"
            />

            {error && (
              <p className="text-[13px] text-red-500 font-medium mb-3">{error}</p>
            )}

            <button
              onClick={save}
              disabled={!name.trim() || saving}
              className="w-full bg-foreground text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-25 active:scale-[0.98] transition-all"
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
