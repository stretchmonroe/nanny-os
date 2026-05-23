"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import type { UserRole } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

type Step = 1 | 2 | 3;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateHomeFlow({ open, onClose }: Props) {
  const [step, setStep]           = useState<Step>(1);
  const [childName, setChildName] = useState("");
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthYear, setBirthYear]   = useState<number | null>(null);
  const [error, setError]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  const { setActiveChild, setCurrentUserRole } = useAppStore();

  async function create(role: UserRole) {
    setStep(3);
    setSaving(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Not signed in");
      setSaving(false);
      setStep(2);
      return;
    }

    try {
      const res = await fetch("/api/create-home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ childName, birthYear, birthMonth, role }),
      });

      const json = await res.json();
      if (!res.ok || !json.child) throw new Error(json.error ?? "Something went wrong");

      setCurrentUserRole(role);
      setActiveChild({
        id:        String(json.child.id),
        name:      json.child.name,
        birthDate: json.child.birth_date ?? null,
      });

      setDone(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
      setStep(2);
    }
  }

  function resetForm() {
    setStep(1);
    setChildName("");
    setBirthMonth(null);
    setBirthYear(null);
    setError("");
    setSaving(false);
    setDone(false);
  }

  function handleClose() {
    onClose();
    resetForm();
  }

  const selectCls = "flex-1 bg-surface-card border border-border rounded-2xl px-4 py-4 text-[15px] font-medium text-foreground outline-none appearance-none cursor-pointer";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="create-home"
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed inset-0 z-[70] bg-surface-page flex flex-col max-w-md mx-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-14 pb-8">
            <div>
              {step < 3 && (
                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1.5">
                  Step {step} of 2
                </p>
              )}
              <h1 className="text-[30px] font-black text-foreground tracking-tight leading-tight">
                {step === 1 && "Your little one"}
                {step === 2 && "Your role"}
                {step === 3 && (done ? "You're all set" : "Setting up…")}
              </h1>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform mt-1"
            >
              <X size={15} className="text-muted-foreground" />
            </button>
          </div>

          {/* Step content */}
          <div className="flex-1 px-5 overflow-y-auto">

            {/* Step 1 — child details */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">
                    Name
                  </label>
                  <input
                    autoFocus
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Mateo"
                    onKeyDown={(e) => e.key === "Enter" && childName.trim() && setStep(2)}
                    className="w-full bg-surface-card border border-border rounded-2xl px-4 py-4 text-[18px] font-semibold text-foreground placeholder:text-muted-foreground/35 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">
                    Birthday{" "}
                    <span className="font-normal normal-case text-muted-foreground/40">
                      — optional
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={birthMonth ?? ""}
                      onChange={(e) => setBirthMonth(e.target.value ? Number(e.target.value) : null)}
                      className={selectCls}
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={birthYear ?? ""}
                      onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : null)}
                      className={selectCls}
                    >
                      <option value="">Year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — role */}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
                  How will you be using Ankur for{" "}
                  <span className="font-semibold text-foreground">{childName}</span>?
                </p>

                <RoleCard
                  emoji="🏠"
                  title="I'm the parent"
                  description="I'll manage the home and invite our nanny"
                  onClick={() => create("parent")}
                />
                <RoleCard
                  emoji="🌱"
                  title="I'm the nanny"
                  description="I care for this little one and log their days"
                  onClick={() => create("nanny")}
                />

                {error && (
                  <p className="text-[13px] text-red-500 font-medium pt-2">{error}</p>
                )}
              </div>
            )}

            {/* Step 3 — creating / done */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                {done ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 14 }}
                    className="text-center"
                  >
                    <p className="text-[56px] mb-4">🌿</p>
                    <p className="text-[17px] font-bold text-foreground">
                      {childName}&rsquo;s home is ready
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Welcome to Ankur
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <motion.p
                      className="text-[48px]"
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🌱
                    </motion.p>
                    <p className="text-[15px] font-semibold text-muted-foreground">
                      Setting up your home…
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer CTA — step 1 only */}
          {step === 1 && (
            <div className="px-5 pb-12 pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!childName.trim()}
                className="w-full bg-foreground text-white font-bold text-[15px] py-4 rounded-2xl disabled:opacity-25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                Continue
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RoleCard({
  emoji,
  title,
  description,
  onClick,
}: {
  emoji: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-surface-card border border-border rounded-2xl px-5 py-5 text-left active:scale-[0.98] transition-all shadow-card"
    >
      <p className="text-[22px] mb-2">{emoji}</p>
      <p className="text-[16px] font-bold text-foreground">{title}</p>
      <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
    </button>
  );
}
