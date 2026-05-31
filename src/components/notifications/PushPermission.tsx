"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { registerPush } from "@/lib/push/client";

export default function PushPermission() {
  const [show, setShow] = useState(false);
  const [busy, setBusy]  = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission !== "default") return;
    const t = setTimeout(() => setShow(true), 3500);
    return () => clearTimeout(t);
  }, []);

  async function enable() {
    setBusy(true);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) await registerPush(session.access_token);
    }
    setBusy(false);
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mx-5 mb-4 bg-trust-light dark:bg-trust/10 rounded-2xl px-4 py-3.5 flex items-center gap-3 border border-trust-light dark:border-trust/20"
        >
          <div className="w-8 h-8 rounded-full bg-trust/15 flex items-center justify-center shrink-0">
            <Bell size={14} className="text-trust" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground leading-snug">Stay in the loop</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">Get notified when moments are logged</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={enable}
              disabled={busy}
              className="text-[12px] font-bold text-trust bg-trust/10 px-3 py-1.5 rounded-full active:opacity-70 transition-opacity disabled:opacity-50"
            >
              {busy ? "…" : "Enable"}
            </button>
            <button onClick={() => setShow(false)} className="p-1 active:opacity-60 transition-opacity">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
