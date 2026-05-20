"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import SproutMark from "@/components/brand/SproutMark";
import AnkurWordmark from "@/components/brand/AnkurWordmark";
import { WelcomeSplash } from "./WelcomeSplash";
import { supabase } from "@/lib/supabase/client";
import {
  signUpUser, signInUser,
  createHousehold, createChild, createInvite,
  lookupInvite, acceptInvite,
} from "@/lib/supabase/household";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "parent" | "caregiver";

interface HouseholdData {
  role:               Role | null;
  yourName:           string;
  email:              string;
  password:           string;
  householdName:      string;
  childName:          string;
  childAge:           string;
  inviteEmail:        string;
  inviteNote:         string;
  // caregiver fields
  caregiverEmail:     string;
  caregiverName:      string;
  caregiverPassword:  string;
  // runtime state from DB (not shown in UI)
  householdId:        string;
  childId:            string;
  inviteId:           string;
  inviteHouseholdId:  string;
  inviteHouseholdName: string;
  inviteChildName:    string;
  inviterName:        string;
}

const EMPTY: HouseholdData = {
  role: null, yourName: "", email: "", password: "",
  householdName: "", childName: "", childAge: "",
  inviteEmail: "", inviteNote: "",
  caregiverEmail: "", caregiverName: "", caregiverPassword: "",
  householdId: "", childId: "", inviteId: "",
  inviteHouseholdId: "", inviteHouseholdName: "", inviteChildName: "", inviterName: "",
};

type Step =
  | "role" | "your-name" | "account" | "confirm-email" | "household"
  | "child-name" | "child-age" | "invite" | "complete"
  | "caregiver-join" | "caregiver-name" | "caregiver-account" | "caregiver-complete"
  | "sign-in";

const PARENT_STEPS:    Step[] = ["role","your-name","account","household","child-name","child-age","invite","complete"];
const CAREGIVER_STEPS: Step[] = ["role","caregiver-join","caregiver-name","caregiver-account","caregiver-complete"];

const AGE_OPTIONS = [
  { id: "under-1", emoji: "🌱", label: "Under 1" },
  { id: "1-2",     emoji: "🐣", label: "1 – 2 yrs" },
  { id: "2-3",     emoji: "🌟", label: "2 – 3 yrs" },
  { id: "3-4",     emoji: "🦋", label: "3 – 4 yrs" },
  { id: "4-5",     emoji: "🚀", label: "4 – 5 yrs" },
  { id: "5plus",   emoji: "🌈", label: "5 yrs +" },
];

// ── Animation ─────────────────────────────────────────────────────────────────

const SLIDE = {
  enter:  (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (d: number) => ({ x: d > 0 ? -36 : 36, opacity: 0 }),
};
const SLIDE_T = { duration: 0.22, ease: [0.25, 1, 0.5, 1] as const };

// ── Shell ─────────────────────────────────────────────────────────────────────

interface ShellProps {
  children:  React.ReactNode;
  dotIndex:  number;
  dotTotal:  number;
  onBack?:   () => void;
}

function Shell({ children, dotIndex, dotTotal, onBack }: ShellProps) {
  return (
    <div style={{ minHeight: "100dvh", background: "#F4EFE8", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
        <div style={{ width: 52, display: "flex", alignItems: "center" }}>
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(42,105,101,0.5)", fontSize: 14, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Back
            </motion.button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <SproutMark size={26} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase" as const, letterSpacing: "0.13em" }}>Sprout</div>
            <div style={{ fontSize: 8, color: "rgba(42,105,101,0.35)", fontWeight: 500, marginTop: 2 }}>by Ankur</div>
          </div>
        </div>
        <div style={{ width: 52 }} />
      </div>
      {dotTotal > 0 && (
        <div style={{ display: "flex", gap: 5, justifyContent: "center", paddingTop: 18, paddingBottom: 2 }}>
          {Array.from({ length: dotTotal }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === dotIndex ? 22 : 6, background: i <= dotIndex ? "#2A6965" : "rgba(42,105,101,0.18)" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ height: 6, borderRadius: 99 }}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "15px 18px", fontSize: 16, fontWeight: 500,
  border: "1.5px solid rgba(42,105,101,0.15)", borderRadius: 16,
  background: "white", color: "#261E18",
  boxShadow: "0 2px 10px rgba(42,105,101,0.05)",
  boxSizing: "border-box" as const, outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = "rgba(42,105,101,0.45)";
  e.target.style.boxShadow   = "0 2px 16px rgba(42,105,101,0.12)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = "rgba(42,105,101,0.15)";
  e.target.style.boxShadow   = "0 2px 10px rgba(42,105,101,0.05)";
}

function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#261E18", margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>{title}</h1>
      {sub && <p style={{ fontSize: 15, color: "#7A6D62", margin: 0, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function ErrorNote({ msg }: { msg: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{ fontSize: 13, color: "#C0392B", fontWeight: 600, margin: "8px 0 0" }}
    >
      {msg}
    </motion.p>
  );
}

interface CTABarProps {
  label:    string;
  disabled?: boolean;
  loading?:  boolean;
  onClick:  () => void;
  secondary?: { label: string; onClick: () => void };
}

function CTABar({ label, disabled, loading, onClick, secondary }: CTABarProps) {
  return (
    <div style={{ padding: secondary ? "12px 24px 44px" : "20px 24px 44px", display: "flex", flexDirection: "column", gap: 10 }}>
      <button className="btn-brand" disabled={disabled || loading} onClick={onClick}>
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            {label}
          </span>
        ) : label}
      </button>
      {secondary && (
        <button
          onClick={secondary.onClick}
          style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: "none", fontSize: 15, fontWeight: 600, color: "rgba(42,105,101,0.4)", cursor: "pointer" }}
        >
          {secondary.label}
        </button>
      )}
    </div>
  );
}

// ── Step: Role selection ──────────────────────────────────────────────────────

function RoleStep({ onSelect }: { onSelect: (r: Role) => void }) {
  const [selected, setSelected] = useState<Role | null>(null);

  const ROLES = [
    { role: "parent" as Role,    emoji: "🏡", label: "Parent or guardian",   sub: "I'm setting up our family's home" },
    { role: "caregiver" as Role, emoji: "🤲", label: "Caregiver",            sub: "I've been invited to care for a child" },
  ];

  return (
    <Shell dotIndex={0} dotTotal={0}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title="Who are you in this little one's life?" sub="This shapes how Ankur works for you." />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROLES.map(({ role, emoji, label, sub }) => {
            const active = selected === role;
            return (
              <motion.button
                key={role} whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(role)}
                style={{
                  width: "100%", textAlign: "left",
                  border: `2px solid ${active ? "#2A6965" : "rgba(42,105,101,0.12)"}`,
                  borderRadius: 20, padding: "18px",
                  background: active ? "rgba(42,105,101,0.06)" : "white",
                  display: "flex", alignItems: "center", gap: 16,
                  boxShadow: active ? "0 4px 20px rgba(42,105,101,0.12)" : "0 2px 10px rgba(0,0,0,0.04)",
                  cursor: "pointer", transition: "all 0.2s ease",
                }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: active ? "rgba(42,105,101,0.10)" : "#F4EFE8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: active ? "#2A6965" : "#261E18", lineHeight: 1.25 }}>{label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: active ? "rgba(42,105,101,0.65)" : "#7A6D62", lineHeight: 1.35 }}>{sub}</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: `2px solid ${active ? "#2A6965" : "rgba(42,105,101,0.2)"}`, background: active ? "#2A6965" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      <CTABar label="Continue →" disabled={!selected} onClick={() => selected && onSelect(selected)} />
    </Shell>
  );
}

// ── Step: Your name ───────────────────────────────────────────────────────────

function YourNameStep({ value, onChange, onNext, onBack, dotIndex, dotTotal }: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title="What do we call you?" sub="Just your first name is perfect." />
        <input
          autoFocus type="text" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder="Your first name…"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Create account (email + password) ───────────────────────────────────

function AccountStep({ email, password, yourName, onEmailChange, onPasswordChange, onSubmit, onNext, onNeedsConfirmation, onBack, dotIndex, dotTotal }: {
  email: string; password: string; yourName: string;
  onEmailChange: (v: string) => void; onPasswordChange: (v: string) => void;
  onSubmit: () => Promise<{ needsConfirmation?: boolean }>;
  onNext: () => void; onNeedsConfirmation: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [signMode, setSignMode] = useState<"up" | "in">("up");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPw    = password.length >= 8;
  const canSubmit  = validEmail && validPw && !loading;

  async function handle() {
    if (!canSubmit) return;
    setError(""); setLoading(true);
    try {
      const result = await onSubmit();
      if (result.needsConfirmation) {
        onNeedsConfirmation();
      } else {
        onNext();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      if (msg.includes("already has an account")) setSignMode("in");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    if (!validEmail || !validPw || loading) return;
    setError(""); setLoading(true);
    const { signInUser: fn } = await import("@/lib/supabase/household");
    const result = await fn(email, password);
    if ("error" in result) { setError(result.error); setLoading(false); return; }
    onNext();
    setLoading(false);
  }

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title={yourName ? `${yourName}, create your account.` : "Create your account."}
          sub="Your family's home lives here."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus type="email" value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email address…"
            autoCapitalize="none" autoComplete="email"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur}
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"} value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handle(); }}
              placeholder={signMode === "in" ? "Your password…" : "Create a password…"}
              autoComplete={signMode === "in" ? "current-password" : "new-password"}
              style={{ ...inputStyle, paddingRight: 48 }}
              onFocus={onFocus} onBlur={onBlur}
            />
            <button
              type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(42,105,101,0.45)" }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {signMode === "up" && (
            <p style={{ fontSize: 12, color: "rgba(42,105,101,0.45)", marginTop: 0, fontWeight: 500 }}>
              At least 8 characters.
            </p>
          )}
          {error && <ErrorNote msg={error} />}
        </div>
      </div>
      {signMode === "up" ? (
        <CTABar label="Continue →" loading={loading} disabled={!canSubmit} onClick={handle} />
      ) : (
        <CTABar label="Sign in →" loading={loading} disabled={!canSubmit} onClick={handleSignIn} secondary={{ label: "Back to sign up", onClick: () => { setSignMode("up"); setError(""); } }} />
      )}
    </Shell>
  );
}

// ── Step: Household name ──────────────────────────────────────────────────────

function HouseholdStep({ value, onChange, yourName, onSubmit, onNext, onBack, dotIndex, dotTotal }: {
  value: string; onChange: (v: string) => void; yourName: string;
  onSubmit: () => Promise<void>; onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const suggestion = yourName ? `The ${yourName} Family` : "The Rivera Family";

  async function handle() {
    if (!value.trim() || loading) return;
    setError(""); setLoading(true);
    try { await onSubmit(); onNext(); }
    catch (e) { setError(e instanceof Error ? e.message : "Try again."); }
    finally { setLoading(false); }
  }

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title="What do you call your family?" sub="This is your family's home on Ankur." />
        <input
          autoFocus type="text" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) handle(); }}
          placeholder={suggestion}
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
        {!value && yourName && (
          <motion.button
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(suggestion)}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 14px", borderRadius: 99, background: "rgba(42,105,101,0.08)", border: "1.5px solid rgba(42,105,101,0.12)", fontSize: 13, fontWeight: 600, color: "#2A6965", cursor: "pointer", width: "fit-content" }}
          >
            Use &ldquo;{suggestion}&rdquo; →
          </motion.button>
        )}
        {error && <ErrorNote msg={error} />}
      </div>
      <CTABar label="Continue →" loading={loading} disabled={!value.trim()} onClick={handle} />
    </Shell>
  );
}

// ── Step: Child name ──────────────────────────────────────────────────────────

function ChildNameStep({ value, onChange, onNext, onBack, dotIndex, dotTotal }: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title="Tell us about your little one." sub="What's their name?" />
        <input
          autoFocus type="text" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder="Their name…"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Child age ───────────────────────────────────────────────────────────

function ChildAgeStep({ value, onChange, childName, onSubmit, onNext, onBack, dotIndex, dotTotal }: {
  value: string; onChange: (v: string) => void; childName: string;
  onSubmit: () => Promise<void>; onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handle() {
    if (!value || loading) return;
    setError(""); setLoading(true);
    try { await onSubmit(); onNext(); }
    catch (e) { setError(e instanceof Error ? e.message : "Try again."); }
    finally { setLoading(false); }
  }

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title={`How old is ${childName || "your little one"}?`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {AGE_OPTIONS.map(({ id, emoji, label }, i) => {
            const active = value === id;
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onChange(id)}
                style={{
                  border: `2px solid ${active ? "#2A6965" : "rgba(42,105,101,0.12)"}`,
                  borderRadius: 18, padding: "18px 8px",
                  background: active ? "rgba(42,105,101,0.07)" : "white",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  cursor: "pointer", transition: "all 0.18s ease",
                  boxShadow: active ? "0 4px 16px rgba(42,105,101,0.10)" : "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, textAlign: "center", color: active ? "#2A6965" : "#261E18" }}>{label}</span>
              </motion.button>
            );
          })}
        </div>
        {error && <ErrorNote msg={error} />}
      </div>
      <CTABar label="Continue →" loading={loading} disabled={!value} onClick={handle} />
    </Shell>
  );
}

// ── Step: Invite caregiver ────────────────────────────────────────────────────

function InviteStep({ email, note, onEmailChange, onNoteChange, childName, onNext, onSkip, onBack, dotIndex, dotTotal }: {
  email: string; note: string;
  onEmailChange: (v: string) => void; onNoteChange: (v: string) => void;
  childName: string;
  onNext: () => void; onSkip: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [showNote, setShowNote] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const firstName = email.includes("@") ? email.split("@")[0].split(".")[0] : null;
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : null;

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title={`Who helps care for ${childName || "them"}?`}
          sub="Invite by email — they'll get a warm welcome from Ankur."
        />
        <input
          autoFocus type="email" value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Their email address…"
          autoCapitalize="none" autoComplete="off"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
        {valid && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {!showNote ? (
              <button
                onClick={() => setShowNote(true)}
                style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "rgba(42,105,101,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                + Add a personal note for {displayName ?? "them"}
              </button>
            ) : (
              <textarea
                autoFocus value={note} onChange={(e) => onNoteChange(e.target.value)}
                placeholder={`A note for ${displayName ?? "your caregiver"}…`}
                rows={3}
                style={{ ...inputStyle, marginTop: 12, resize: "none", fontFamily: "inherit", lineHeight: 1.6 } as React.CSSProperties}
                onFocus={onFocus} onBlur={onBlur}
              />
            )}
          </motion.div>
        )}
        {valid && displayName && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 14px", borderRadius: 12, background: "rgba(42,105,101,0.07)" }}
          >
            <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "#2A6965", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={11} strokeWidth={3} color="white" />
            </div>
            <p style={{ fontSize: 13, color: "#2A6965", fontWeight: 600, margin: 0 }}>
              {displayName}&apos;s invite is ready to send
            </p>
          </motion.div>
        )}
      </div>
      <CTABar label="Send invite →" disabled={!valid} onClick={onNext} secondary={{ label: "Skip for now", onClick: onSkip }} />
    </Shell>
  );
}

// ── Step: Parent complete ─────────────────────────────────────────────────────

function ParentCompleteStep({ data }: { data: HouseholdData }) {
  const router = useRouter();
  const childAgeLabel = AGE_OPTIONS.find((a) => a.id === data.childAge)?.label ?? data.childAge;
  const invitedName   = data.inviteEmail
    ? (() => { const s = data.inviteEmail.split("@")[0].split(".")[0]; return s.charAt(0).toUpperCase() + s.slice(1); })()
    : null;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4EFE8", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(150deg, #2A6965 0%, #3D8480 55%, #2A6965 100%)", padding: "56px 28px 44px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 20, opacity: 0.92 }}><AnkurWordmark width={150} priority /></div>
        <div style={{ width: 40, height: 1.5, background: "rgba(255,255,255,0.25)", borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0, textAlign: "center", lineHeight: 1.25, letterSpacing: "-0.02em" }}>Your family home is ready.</h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", textAlign: "center" }}>{data.householdName || "Your family"}</p>
      </div>

      <div style={{ flex: 1, padding: "24px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: "white", borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 16px rgba(42,105,101,0.08)" }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: "rgba(42,105,101,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
            {AGE_OPTIONS.find((a) => a.id === data.childAge)?.emoji ?? "🌱"}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#261E18", lineHeight: 1.2 }}>{data.childName || "Your child"}</p>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#7A6D62" }}>{childAgeLabel} · care profile ready</p>
          </div>
        </motion.div>

        {invitedName && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: "white", borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 16px rgba(42,105,101,0.08)" }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: "rgba(106,156,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤲</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#261E18", lineHeight: 1.2 }}>{invitedName}</p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#7A6D62" }}>Invite sent · caregiver access pending</p>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "#6A9C80", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={12} strokeWidth={3} color="white" />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ padding: "14px 18px", borderRadius: 16, background: "rgba(42,105,101,0.06)", border: "1.5px solid rgba(42,105,101,0.10)" }}
        >
          <p style={{ fontSize: 13, color: "rgba(42,105,101,0.75)", fontWeight: 500, margin: 0, lineHeight: 1.55 }}>
            Ankur learns as {data.childName || "your child"}&apos;s days are logged. Each moment deepens the picture.
          </p>
        </motion.div>
      </div>

      <div style={{ padding: "24px 24px 44px" }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <button className="btn-brand" onClick={() => router.push("/home")}>Enter your home →</button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Step: Caregiver email + invite lookup ─────────────────────────────────────

function CaregiverJoinStep({ value, onChange, onSubmit, onNext, onBack, dotIndex, dotTotal }: {
  value: string; onChange: (v: string) => void;
  onSubmit: () => Promise<void>; onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  async function handle() {
    if (!valid || loading) return;
    setError(""); setLoading(true);
    try { await onSubmit(); onNext(); }
    catch (e) { setError(e instanceof Error ? e.message : "Try again."); }
    finally { setLoading(false); }
  }

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title="Enter the email you were invited on." sub="We'll use this to connect you with the family." />
        <input
          autoFocus type="email" value={value}
          onChange={(e) => { onChange(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) handle(); }}
          placeholder="Your email address…"
          autoCapitalize="none" autoComplete="email"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
        <p style={{ fontSize: 12, color: "rgba(42,105,101,0.4)", marginTop: 12, fontWeight: 500, lineHeight: 1.55 }}>
          Haven&apos;t received an invite yet? Ask your family to send one from their Ankur home.
        </p>
        {error && <ErrorNote msg={error} />}
      </div>
      <CTABar label={loading ? "Looking up…" : "Continue →"} loading={loading} disabled={!valid} onClick={handle} />
    </Shell>
  );
}

// ── Step: Caregiver name ──────────────────────────────────────────────────────

function CaregiverNameStep({ value, householdName, onChange, onNext, onBack, dotIndex, dotTotal }: {
  value: string; householdName: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        {householdName && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "10px 14px", borderRadius: 12, background: "rgba(42,105,101,0.07)" }}
          >
            <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "#2A6965", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={11} strokeWidth={3} color="white" />
            </div>
            <p style={{ fontSize: 13, color: "#2A6965", fontWeight: 600, margin: 0 }}>
              Invite found · {householdName}
            </p>
          </motion.div>
        )}
        <StepHeading title="What does the family call you?" sub="This is how you'll appear in the household." />
        <input
          autoFocus type="text" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder="Your first name…"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Caregiver account (password + join) ─────────────────────────────────

function CaregiverAccountStep({ caregiverName, onSubmit, onNext, onBack, dotIndex, dotTotal }: {
  caregiverName: string;
  onSubmit: (password: string) => Promise<void>;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const canSubmit = password.length >= 8 && !loading;

  async function handle() {
    if (!canSubmit) return;
    setError(""); setLoading(true);
    try { await onSubmit(password); onNext(); }
    catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title={caregiverName ? `Almost there, ${caregiverName}.` : "Almost there."}
          sub="Create a password to access the family's home."
        />
        <div style={{ position: "relative" }}>
          <input
            autoFocus
            type={showPw ? "text" : "password"} value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handle(); }}
            placeholder="Create a password…"
            autoComplete="new-password"
            style={{ ...inputStyle, paddingRight: 48 }}
            onFocus={onFocus} onBlur={onBlur}
          />
          <button
            type="button" onClick={() => setShowPw((v) => !v)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(42,105,101,0.45)" }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "rgba(42,105,101,0.45)", marginTop: 10, fontWeight: 500 }}>At least 8 characters.</p>
        {error && <ErrorNote msg={error} />}
      </div>
      <CTABar label={loading ? "Joining household…" : "Join household →"} loading={loading} disabled={!canSubmit} onClick={handle} />
    </Shell>
  );
}

// ── Step: Caregiver complete ──────────────────────────────────────────────────

function CaregiverCompleteStep({ data }: { data: HouseholdData }) {
  const router = useRouter();
  const childAge = AGE_OPTIONS.find((a) => a.id === data.inviteChildName)?.emoji;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4EFE8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 28px 56px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 280, damping: 22 }} style={{ marginBottom: 28 }}>
        <SproutMark size={72} priority />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#261E18", margin: "0 0 12px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
          {data.caregiverName ? `Welcome, ${data.caregiverName}.` : "You're in."}
        </h1>

        {data.inviteHouseholdName && (
          <p style={{ fontSize: 15, color: "#2A6965", fontWeight: 600, margin: "0 0 8px" }}>
            {data.inviteHouseholdName}
          </p>
        )}

        <p style={{ fontSize: 15, color: "#7A6D62", margin: "0 0 32px", lineHeight: 1.55 }}>
          {data.inviteChildName
            ? `You now have access to ${data.inviteChildName}'s home on Ankur. Every moment you log becomes part of their story.`
            : "You now have access to the family's home on Ankur. Every moment you log becomes part of the story."}
        </p>
      </motion.div>

      {data.inviterName && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ marginBottom: 28, padding: "12px 18px", borderRadius: 14, background: "rgba(42,105,101,0.07)", fontSize: 13, color: "rgba(42,105,101,0.75)", fontWeight: 500 }}
        >
          Invited by {data.inviterName} {childAge ?? "🌱"}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ width: "100%" }}>
        <button className="btn-brand" onClick={() => router.push("/home")}>Start caregiving →</button>
      </motion.div>
    </div>
  );
}

// ── Step: Confirm email ───────────────────────────────────────────────────────

function ConfirmEmailStep({ email }: { email: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error,    setError]    = useState("");

  async function handleCheckConfirmed() {
    setChecking(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.replace("/home");
    } else {
      setError("Email not confirmed yet. Check your inbox and try again.");
      setChecking(false);
    }
  }

  return (
    <Shell dotIndex={0} dotTotal={0}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} style={{ fontSize: 64, marginBottom: 24 }}>
          📬
        </motion.div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#261E18", margin: "0 0 12px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>Check your inbox</h1>
        <p style={{ fontSize: 15, color: "#7A6D62", margin: "0 0 8px", lineHeight: 1.55 }}>
          We sent a confirmation link to
        </p>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#2A6965", margin: "0 0 32px" }}>{email}</p>
        <p style={{ fontSize: 13, color: "rgba(42,105,101,0.5)", margin: "0 0 24px", lineHeight: 1.55 }}>
          Click the link in the email, then come back and tap below.
        </p>
        {error && <ErrorNote msg={error} />}
      </div>
      <CTABar label={checking ? "Checking…" : "I've confirmed my email →"} loading={checking} onClick={handleCheckConfirmed} />
    </Shell>
  );
}

// ── Step: Sign in (returning users) ──────────────────────────────────────────

function SignInStep({ onBack }: { onBack: () => void }) {
  const router  = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = validEmail && password.length >= 6 && !loading;

  async function handle() {
    if (!canSubmit) return;
    setError(""); setLoading(true);
    try {
      const result = await signInUser(email, password);
      if ("error" in result) throw new Error(result.error);
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign in. Check your email and password.");
      setLoading(false);
    }
  }

  return (
    <Shell dotIndex={0} dotTotal={0} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title="Welcome back." sub="Sign in to your family's home." />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus type="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Tab") e.preventDefault(); }}
            placeholder="Email address…"
            autoCapitalize="none" autoComplete="email"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur}
          />
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"} value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handle(); }}
              placeholder="Password…"
              autoComplete="current-password"
              style={{ ...inputStyle, paddingRight: 48 }}
              onFocus={onFocus} onBlur={onBlur}
            />
            <button
              type="button" onClick={() => setShowPw((v) => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(42,105,101,0.45)" }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <ErrorNote msg={error} />}
        </div>
      </div>
      <CTABar label={loading ? "Signing in…" : "Sign in →"} loading={loading} disabled={!canSubmit} onClick={handle} />
    </Shell>
  );
}


// ── Main orchestrator ─────────────────────────────────────────────────────────

export function HouseholdFlow() {
  const [started, setStarted] = useState(false);
  const [step,    setStep]    = useState<Step>("role");
  const [dir,     setDir]     = useState(1);
  const [data,    setData]    = useState<HouseholdData>(EMPTY);

  function update(patch: Partial<HouseholdData>) { setData((d) => ({ ...d, ...patch })); }
  function advance(to: Step) { setDir(1);  setStep(to); }
  function retreat(to: Step) { setDir(-1); setStep(to); }

  const seq     = data.role === "caregiver" ? CAREGIVER_STEPS : PARENT_STEPS;
  const dotSteps = seq.slice(1, -1);
  const dotTotal = dotSteps.length;
  const dotIdx   = dotSteps.indexOf(step);

  if (!started) return (
    <WelcomeSplash
      onEnter={() => setStarted(true)}
      onSignIn={() => { setStarted(true); advance("sign-in"); }}
    />
  );

  return (
    <AnimatePresence mode="wait" custom={dir}>
      <motion.div key={step} custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={SLIDE_T} style={{ position: "relative" }}>

        {step === "sign-in" && (
          <SignInStep onBack={() => retreat("role")} />
        )}

        {step === "role" && (
          <RoleStep
            onSelect={(role) => { update({ role }); advance(role === "parent" ? "your-name" : "caregiver-join"); }}
          />
        )}

        {/* ── Parent path ────────────────────────────────────────────── */}

        {step === "your-name" && (
          <YourNameStep
            value={data.yourName} onChange={(v) => update({ yourName: v })}
            onNext={() => advance("account")} onBack={() => retreat("role")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "account" && (
          <AccountStep
            email={data.email} password={data.password} yourName={data.yourName}
            onEmailChange={(v) => update({ email: v })}
            onPasswordChange={(v) => update({ password: v })}
            onSubmit={async () => {
              const r = await signUpUser(data.email, data.password, data.yourName);
              if ("error" in r) throw new Error(r.error);
              return { needsConfirmation: r.needsConfirmation };
            }}
            onNext={() => advance("household")}
            onNeedsConfirmation={() => advance("confirm-email")}
            onBack={() => retreat("your-name")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "confirm-email" && (
          <ConfirmEmailStep email={data.email} />
        )}

        {step === "household" && (
          <HouseholdStep
            value={data.householdName} onChange={(v) => update({ householdName: v })} yourName={data.yourName}
            onSubmit={async () => {
              const r = await createHousehold(data.householdName);
              if ("error" in r) throw new Error(r.error);
              update({ householdId: r.id });
            }}
            onNext={() => advance("child-name")} onBack={() => retreat("account")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "child-name" && (
          <ChildNameStep
            value={data.childName} onChange={(v) => update({ childName: v })}
            onNext={() => advance("child-age")} onBack={() => retreat("household")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "child-age" && (
          <ChildAgeStep
            value={data.childAge} onChange={(v) => update({ childAge: v })} childName={data.childName}
            onSubmit={async () => {
              if (!data.householdId) throw new Error("Household not found. Please go back and try again.");
              const r = await createChild(data.childName, data.childAge, data.householdId);
              if ("error" in r) throw new Error(r.error);
              update({ childId: r.id });
            }}
            onNext={() => advance("invite")} onBack={() => retreat("child-name")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "invite" && (
          <InviteStep
            email={data.inviteEmail} note={data.inviteNote}
            onEmailChange={(v) => update({ inviteEmail: v })}
            onNoteChange={(v)  => update({ inviteNote: v  })}
            childName={data.childName}
            onNext={() => {
              // fire-and-forget; don't block on invite creation
              if (data.inviteEmail && data.householdId) {
                createInvite(data.inviteEmail, data.householdId, data.yourName, data.childName, data.inviteNote || undefined);
              }
              advance("complete");
            }}
            onSkip={() => advance("complete")}
            onBack={() => retreat("child-age")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "complete" && <ParentCompleteStep data={data} />}

        {/* ── Caregiver path ─────────────────────────────────────────── */}

        {step === "caregiver-join" && (
          <CaregiverJoinStep
            value={data.caregiverEmail} onChange={(v) => update({ caregiverEmail: v })}
            onSubmit={async () => {
              const invite = await lookupInvite(data.caregiverEmail);
              if (!invite) throw new Error("We couldn't find an invite for this email. Ask your family to send one.");
              update({
                inviteId:           invite.invite_id,
                inviteHouseholdId:  invite.household_id,
                inviteHouseholdName: invite.household_name ?? "",
                inviteChildName:    invite.child_name ?? "",
                inviterName:        invite.inviter_name ?? "",
              });
            }}
            onNext={() => advance("caregiver-name")} onBack={() => retreat("role")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "caregiver-name" && (
          <CaregiverNameStep
            value={data.caregiverName} householdName={data.inviteHouseholdName}
            onChange={(v) => update({ caregiverName: v })}
            onNext={() => advance("caregiver-account")} onBack={() => retreat("caregiver-join")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "caregiver-account" && (
          <CaregiverAccountStep
            caregiverName={data.caregiverName}
            onSubmit={async (password) => {
              update({ caregiverPassword: password });
              const r = await signUpUser(data.caregiverEmail, password, data.caregiverName);
              if ("error" in r) throw new Error(r.error);
              const { error: acceptErr } = await acceptInvite(data.inviteId, r.userId);
              if (acceptErr) throw new Error(acceptErr);
            }}
            onNext={() => advance("caregiver-complete")} onBack={() => retreat("caregiver-name")}
            dotIndex={dotIdx} dotTotal={dotTotal}
          />
        )}

        {step === "caregiver-complete" && <CaregiverCompleteStep data={data} />}

      </motion.div>
    </AnimatePresence>
  );
}
