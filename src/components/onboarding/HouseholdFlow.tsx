"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import SproutMark from "@/components/brand/SproutMark";
import AnkurWordmark from "@/components/brand/AnkurWordmark";
import { WelcomeSplash } from "./WelcomeSplash";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "parent" | "caregiver";

interface HouseholdData {
  role:              Role | null;
  yourName:          string;
  email:             string;
  householdName:     string;
  childName:         string;
  childAge:          string;
  inviteEmail:       string;
  inviteNote:        string;
  caregiverEmail:    string;
  caregiverName:     string;
}

const EMPTY: HouseholdData = {
  role: null, yourName: "", email: "", householdName: "",
  childName: "", childAge: "", inviteEmail: "", inviteNote: "",
  caregiverEmail: "", caregiverName: "",
};

// Parent: role → your-name → email → household → child-name → child-age → invite → complete
// Caregiver: role → join → caregiver-name → caregiver-complete
type Step =
  | "role" | "your-name" | "email" | "household"
  | "child-name" | "child-age" | "invite" | "complete"
  | "caregiver-join" | "caregiver-name" | "caregiver-complete";

const PARENT_SEQUENCE: Step[]    = ["role","your-name","email","household","child-name","child-age","invite","complete"];
const CAREGIVER_SEQUENCE: Step[] = ["role","caregiver-join","caregiver-name","caregiver-complete"];

const AGE_OPTIONS = [
  { id: "under-1", emoji: "🌱", label: "Under 1" },
  { id: "1-2",     emoji: "🐣", label: "1 – 2 yrs" },
  { id: "2-3",     emoji: "🌟", label: "2 – 3 yrs" },
  { id: "3-4",     emoji: "🦋", label: "3 – 4 yrs" },
  { id: "4-5",     emoji: "🚀", label: "4 – 5 yrs" },
  { id: "5plus",   emoji: "🌈", label: "5 yrs +" },
];

// ── Slide animation ───────────────────────────────────────────────────────────

const SLIDE = {
  enter:  (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
};
const SLIDE_T = { duration: 0.22, ease: [0.25, 1, 0.5, 1] as const };

// ── Shell: top bar + dots + child slot ───────────────────────────────────────

interface ShellProps {
  children: React.ReactNode;
  dotIndex: number;
  dotTotal: number;
  onBack?: () => void;
}

function Shell({ children, dotIndex, dotTotal, onBack }: ShellProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F4EFE8",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 0",
        }}
      >
        <div style={{ width: 52, display: "flex", alignItems: "center" }}>
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                color: "rgba(42,105,101,0.5)", fontSize: 14, fontWeight: 500,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Back
            </motion.button>
          )}
        </div>

        {/* Sprout identity — always centered */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <SproutMark size={26} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase" as const, letterSpacing: "0.13em" }}>
              Sprout
            </div>
            <div style={{ fontSize: 8, color: "rgba(42,105,101,0.35)", fontWeight: 500, marginTop: 2 }}>
              by Ankur
            </div>
          </div>
        </div>

        <div style={{ width: 52 }} />
      </div>

      {/* Progress dots */}
      {dotTotal > 0 && (
        <div style={{ display: "flex", gap: 5, justifyContent: "center", paddingTop: 18, paddingBottom: 2 }}>
          {Array.from({ length: dotTotal }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === dotIndex ? 22 : 6,
                background: i <= dotIndex ? "#2A6965" : "rgba(42,105,101,0.18)",
              }}
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

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px 18px",
  fontSize: 16,
  fontWeight: 500,
  border: "1.5px solid rgba(42,105,101,0.15)",
  borderRadius: 16,
  background: "white",
  color: "#261E18",
  boxShadow: "0 2px 10px rgba(42,105,101,0.05)",
  boxSizing: "border-box" as const,
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

function onFocusStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = "rgba(42,105,101,0.45)";
  e.target.style.boxShadow   = "0 2px 16px rgba(42,105,101,0.12)";
}
function onBlurStyle(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.style.borderColor = "rgba(42,105,101,0.15)";
  e.target.style.boxShadow   = "0 2px 10px rgba(42,105,101,0.05)";
}

// ── Shared CTA bar ─────────────────────────────────────────────────────────────

function CTABar({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <div style={{ padding: "20px 24px 44px" }}>
      <button className="btn-brand" disabled={disabled} onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

// ── Step heading ──────────────────────────────────────────────────────────────

function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1
        style={{
          fontSize: 26, fontWeight: 800, color: "#261E18",
          margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h1>
      {sub && (
        <p style={{ fontSize: 15, color: "#7A6D62", margin: 0, lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Step 1: Role selection ─────────────────────────────────────────────────────

function RoleStep({ onSelect }: { onSelect: (r: Role) => void }) {
  const [selected, setSelected] = useState<Role | null>(null);

  const ROLES = [
    {
      role: "parent" as Role,
      emoji: "🏡",
      label: "Parent or guardian",
      sub:   "I'm setting up our family's home",
    },
    {
      role: "caregiver" as Role,
      emoji: "🤲",
      label: "Caregiver",
      sub:   "I've been invited to care for a child",
    },
  ];

  return (
    <Shell dotIndex={0} dotTotal={0}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="Who are you in this little one's life?"
          sub="This shapes how Ankur works for you."
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROLES.map(({ role, emoji, label, sub }) => {
            const active = selected === role;
            return (
              <motion.button
                key={role}
                whileTap={{ scale: 0.97 }}
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
                <div
                  style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: active ? "rgba(42,105,101,0.10)" : "#F4EFE8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, transition: "background 0.2s ease",
                  }}
                >
                  {emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: active ? "#2A6965" : "#261E18", lineHeight: 1.25, transition: "color 0.2s ease" }}>
                    {label}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: active ? "rgba(42,105,101,0.65)" : "#7A6D62", lineHeight: 1.35 }}>
                    {sub}
                  </p>
                </div>
                <div
                  style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${active ? "#2A6965" : "rgba(42,105,101,0.2)"}`,
                    background: active ? "#2A6965" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                >
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

// ── Step: Your name ────────────────────────────────────────────────────────────

function YourNameStep({
  value, onChange, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="What do we call you?"
          sub="Just your first name is perfect."
        />
        <input
          ref={ref}
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder="Your first name…"
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Email ────────────────────────────────────────────────────────────────

function EmailStep({
  value, onChange, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="How should we reach you?"
          sub="We'll send you a link to sign in — no password needed."
        />
        <input
          autoFocus
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) onNext(); }}
          placeholder="Your email address…"
          autoCapitalize="none"
          autoComplete="email"
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />
        <p style={{ fontSize: 12, color: "rgba(42,105,101,0.45)", marginTop: 10, fontWeight: 500 }}>
          Your email is only used to access your family's home. We don't share it.
        </p>
      </div>
      <CTABar label="Continue →" disabled={!valid} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Household name ───────────────────────────────────────────────────────

function HouseholdStep({
  value, onChange, yourName, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  yourName: string; onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const suggestion = yourName ? `The ${yourName} Family` : "The Rivera Family";

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="What do you call your family?"
          sub="This is your family's home on Ankur."
        />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder={suggestion}
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />

        {/* Quick-fill suggestion */}
        {!value && yourName && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(suggestion)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginTop: 12, padding: "8px 14px", borderRadius: 99,
              background: "rgba(42,105,101,0.08)",
              border: "1.5px solid rgba(42,105,101,0.12)",
              fontSize: 13, fontWeight: 600, color: "#2A6965",
              cursor: "pointer",
            }}
          >
            Use &ldquo;{suggestion}&rdquo; →
          </motion.button>
        )}
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Child name ───────────────────────────────────────────────────────────

function ChildNameStep({
  value, onChange, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="Tell us about your little one."
          sub="What's their name?"
        />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder="Their name…"
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Child age ────────────────────────────────────────────────────────────

function ChildAgeStep({
  value, onChange, childName, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  childName: string; onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading title={`How old is ${childName || "they"}?`} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {AGE_OPTIONS.map(({ id, emoji, label }, i) => {
            const active = value === id;
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => { onChange(id); }}
                style={{
                  border: `2px solid ${active ? "#2A6965" : "rgba(42,105,101,0.12)"}`,
                  borderRadius: 18,
                  padding: "18px 8px",
                  background: active ? "rgba(42,105,101,0.07)" : "white",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  cursor: "pointer", transition: "all 0.18s ease",
                  boxShadow: active ? "0 4px 16px rgba(42,105,101,0.10)" : "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
                <span
                  style={{
                    fontSize: 12, fontWeight: 700, lineHeight: 1.2, textAlign: "center",
                    color: active ? "#2A6965" : "#261E18",
                    transition: "color 0.18s ease",
                  }}
                >
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
      <CTABar label="Continue →" disabled={!value} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Invite caregiver ─────────────────────────────────────────────────────

function InviteStep({
  email, note, onEmailChange, onNoteChange,
  childName, onNext, onSkip, onBack,
  dotIndex, dotTotal,
}: {
  email: string; note: string;
  onEmailChange: (v: string) => void; onNoteChange: (v: string) => void;
  childName: string; onNext: () => void; onSkip: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const [showNote, setShowNote] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const caregiverFirstName = email.includes("@") ? email.split("@")[0].split(".")[0] : null;
  const displayName = caregiverFirstName
    ? caregiverFirstName.charAt(0).toUpperCase() + caregiverFirstName.slice(1)
    : null;

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title={`Who helps care for ${childName || "them"}?`}
          sub="Invite by email — they'll get a warm welcome from Ankur."
        />

        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Their email address…"
          autoCapitalize="none"
          autoComplete="off"
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />

        {/* Optional note */}
        {valid && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {!showNote ? (
              <button
                onClick={() => setShowNote(true)}
                style={{
                  marginTop: 12, fontSize: 13, fontWeight: 600,
                  color: "rgba(42,105,101,0.6)", background: "none",
                  border: "none", cursor: "pointer", padding: 0,
                }}
              >
                + Add a personal note for {displayName ?? "them"}
              </button>
            ) : (
              <textarea
                autoFocus
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={`A note for ${displayName ?? "your caregiver"}…`}
                rows={3}
                style={{
                  ...inputStyle,
                  marginTop: 12,
                  resize: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6,
                } as React.CSSProperties}
                onFocus={onFocusStyle}
                onBlur={onBlurStyle}
              />
            )}
          </motion.div>
        )}

        {/* Confirmed state */}
        {valid && displayName && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              marginTop: 16, padding: "10px 14px", borderRadius: 12,
              background: "rgba(42,105,101,0.07)",
            }}
          >
            <div
              style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: "#2A6965", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Check size={11} strokeWidth={3} color="white" />
            </div>
            <p style={{ fontSize: 13, color: "#2A6965", fontWeight: 600, margin: 0 }}>
              {displayName}&apos;s invite is ready to send
            </p>
          </motion.div>
        )}
      </div>

      <div style={{ padding: "12px 24px 44px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="btn-brand"
          disabled={!valid}
          onClick={onNext}
        >
          Send invite →
        </button>
        <button
          onClick={onSkip}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, border: "none",
            background: "none", fontSize: 15, fontWeight: 600,
            color: "rgba(42,105,101,0.4)", cursor: "pointer",
          }}
        >
          Skip for now
        </button>
      </div>
    </Shell>
  );
}

// ── Step: Parent complete ──────────────────────────────────────────────────────

function ParentCompleteStep({ data }: { data: HouseholdData }) {
  const router = useRouter();

  function enter() {
    try {
      sessionStorage.setItem("nannyos_household", JSON.stringify({
        householdName: data.householdName,
        childName: data.childName,
        childAge: data.childAge,
        yourName: data.yourName,
        email: data.email,
      }));
    } catch { /* ok */ }
    router.push("/home");
  }

  const childAgeLabel = AGE_OPTIONS.find((a) => a.id === data.childAge)?.label ?? data.childAge;
  const invitedName   = data.inviteEmail
    ? (() => {
        const local = data.inviteEmail.split("@")[0].split(".")[0];
        return local.charAt(0).toUpperCase() + local.slice(1);
      })()
    : null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F4EFE8",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Teal hero */}
      <div
        style={{
          background: "linear-gradient(150deg, #2A6965 0%, #3D8480 55%, #2A6965 100%)",
          padding: "56px 28px 44px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        <div style={{ marginBottom: 20, opacity: 0.92 }}>
          <AnkurWordmark width={150} priority />
        </div>
        <div style={{ width: 40, height: 1.5, background: "rgba(255,255,255,0.25)", borderRadius: 2, marginBottom: 20 }} />
        <h2
          style={{
            fontSize: 24, fontWeight: 800, color: "white", margin: 0,
            textAlign: "center", lineHeight: 1.25, letterSpacing: "-0.02em",
          }}
        >
          Your family home is ready.
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", textAlign: "center" }}>
          {data.householdName || "Your family"}
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ flex: 1, padding: "24px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Child card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          style={{
            background: "white", borderRadius: 20, padding: "18px 20px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 2px 16px rgba(42,105,101,0.08)",
          }}
        >
          <div
            style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "rgba(42,105,101,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}
          >
            {AGE_OPTIONS.find((a) => a.id === data.childAge)?.emoji ?? "🌱"}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#261E18", lineHeight: 1.2 }}>
              {data.childName || "Your child"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#7A6D62" }}>
              {childAgeLabel} · care profile ready
            </p>
          </div>
        </motion.div>

        {/* Caregiver invite */}
        {invitedName && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            style={{
              background: "white", borderRadius: 20, padding: "18px 20px",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 2px 16px rgba(42,105,101,0.08)",
            }}
          >
            <div
              style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "rgba(106,156,128,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}
            >
              🤲
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#261E18", lineHeight: 1.2 }}>
                {invitedName}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#7A6D62" }}>
                Invite sent · caregiver access pending
              </p>
            </div>
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: "#6A9C80",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Check size={12} strokeWidth={3} color="white" />
            </div>
          </motion.div>
        )}

        {/* What's next hint */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          style={{
            padding: "14px 18px", borderRadius: 16,
            background: "rgba(42,105,101,0.06)",
            border: "1.5px solid rgba(42,105,101,0.10)",
          }}
        >
          <p style={{ fontSize: 13, color: "rgba(42,105,101,0.75)", fontWeight: 500, margin: 0, lineHeight: 1.55 }}>
            Ankur learns as {data.childName || "your child"}&apos;s days are logged. Each moment deepens the picture.
          </p>
        </motion.div>
      </div>

      <div style={{ padding: "24px 24px 44px" }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <button className="btn-brand" onClick={enter}>
            Enter your home →
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Step: Caregiver join ────────────────────────────────────────────────────────

function CaregiverJoinStep({
  value, onChange, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="Enter the email you were invited on."
          sub="We'll use this to connect you with the family."
        />
        <input
          autoFocus
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) onNext(); }}
          placeholder="Your email address…"
          autoCapitalize="none"
          autoComplete="email"
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />
        <p
          style={{
            fontSize: 12, color: "rgba(42,105,101,0.4)", marginTop: 12,
            fontWeight: 500, lineHeight: 1.55,
          }}
        >
          Haven&apos;t received an invite yet? Ask your family to send one from their Ankur home.
        </p>
      </div>
      <CTABar label="Continue →" disabled={!valid} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Caregiver name ───────────────────────────────────────────────────────

function CaregiverNameStep({
  value, onChange, onNext, onBack,
  dotIndex, dotTotal,
}: {
  value: string; onChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
  dotIndex: number; dotTotal: number;
}) {
  return (
    <Shell dotIndex={dotIndex} dotTotal={dotTotal} onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "36px 24px 0" }}>
        <StepHeading
          title="What does the family call you?"
          sub="This is how you'll appear in the household."
        />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onNext(); }}
          placeholder="Your first name…"
          style={inputStyle}
          onFocus={onFocusStyle}
          onBlur={onBlurStyle}
        />
      </div>
      <CTABar label="Continue →" disabled={!value.trim()} onClick={onNext} />
    </Shell>
  );
}

// ── Step: Caregiver complete ───────────────────────────────────────────────────

function CaregiverCompleteStep({ data }: { data: HouseholdData }) {
  const router = useRouter();

  function enter() {
    try {
      sessionStorage.setItem("nannyos_household", JSON.stringify({
        role: "caregiver", yourName: data.caregiverName,
        email: data.caregiverEmail,
      }));
    } catch { /* ok */ }
    router.push("/home");
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F4EFE8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 28px 56px",
        maxWidth: 480,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        style={{ marginBottom: 28 }}
      >
        <SproutMark size={72} priority />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        <h1
          style={{
            fontSize: 26, fontWeight: 800, color: "#261E18",
            margin: "0 0 12px", lineHeight: 1.25, letterSpacing: "-0.02em",
          }}
        >
          {data.caregiverName
            ? `Welcome, ${data.caregiverName}.`
            : "You're in."}
        </h1>
        <p style={{ fontSize: 15, color: "#7A6D62", margin: "0 0 32px", lineHeight: 1.55 }}>
          You now have access to the family&apos;s home on Ankur. Every moment you log becomes part of the story.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{ width: "100%" }}
      >
        <button className="btn-brand" onClick={enter}>
          Start caregiving →
        </button>
      </motion.div>
    </div>
  );
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

export function HouseholdFlow() {
  const [started, setStarted] = useState(false);
  const [step,    setStep]    = useState<Step>("role");
  const [dir,     setDir]     = useState(1);
  const [data,    setData]    = useState<HouseholdData>(EMPTY);

  function update(patch: Partial<HouseholdData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  function advance(to: Step) {
    setDir(1);
    setStep(to);
  }

  function retreat(to: Step) {
    setDir(-1);
    setStep(to);
  }

  // ── Derive dot position from sequence ──────────────────────────────
  const seq   = data.role === "caregiver" ? CAREGIVER_SEQUENCE : PARENT_SEQUENCE;
  const total = seq.length - 2;             // exclude "role" and "complete" steps from dots
  const contentSteps = seq.slice(1, -1);    // steps with dots
  const dotIdx = contentSteps.indexOf(step);// -1 if not a content step

  if (!started) {
    return <WelcomeSplash onEnter={() => setStarted(true)} />;
  }

  return (
    <AnimatePresence mode="wait" custom={dir}>
      <motion.div
        key={step}
        custom={dir}
        variants={SLIDE}
        initial="enter"
        animate="center"
        exit="exit"
        transition={SLIDE_T}
        style={{ position: "relative" }}
      >

        {step === "role" && (
          <RoleStep
            onSelect={(role) => {
              update({ role });
              advance(role === "parent" ? "your-name" : "caregiver-join");
            }}
          />
        )}

        {/* ── Parent path ──────────────────────────────────────────── */}

        {step === "your-name" && (
          <YourNameStep
            value={data.yourName}
            onChange={(v) => update({ yourName: v })}
            onNext={() => advance("email")}
            onBack={() => retreat("role")}
            dotIndex={0} dotTotal={total}
          />
        )}

        {step === "email" && (
          <EmailStep
            value={data.email}
            onChange={(v) => update({ email: v })}
            onNext={() => advance("household")}
            onBack={() => retreat("your-name")}
            dotIndex={1} dotTotal={total}
          />
        )}

        {step === "household" && (
          <HouseholdStep
            value={data.householdName}
            onChange={(v) => update({ householdName: v })}
            yourName={data.yourName}
            onNext={() => advance("child-name")}
            onBack={() => retreat("email")}
            dotIndex={2} dotTotal={total}
          />
        )}

        {step === "child-name" && (
          <ChildNameStep
            value={data.childName}
            onChange={(v) => update({ childName: v })}
            onNext={() => advance("child-age")}
            onBack={() => retreat("household")}
            dotIndex={3} dotTotal={total}
          />
        )}

        {step === "child-age" && (
          <ChildAgeStep
            value={data.childAge}
            onChange={(v) => update({ childAge: v })}
            childName={data.childName}
            onNext={() => advance("invite")}
            onBack={() => retreat("child-name")}
            dotIndex={4} dotTotal={total}
          />
        )}

        {step === "invite" && (
          <InviteStep
            email={data.inviteEmail}
            note={data.inviteNote}
            onEmailChange={(v) => update({ inviteEmail: v })}
            onNoteChange={(v)  => update({ inviteNote: v  })}
            childName={data.childName}
            onNext={() => advance("complete")}
            onSkip={() => advance("complete")}
            onBack={() => retreat("child-age")}
            dotIndex={5} dotTotal={total}
          />
        )}

        {step === "complete" && <ParentCompleteStep data={data} />}

        {/* ── Caregiver path ───────────────────────────────────────── */}

        {step === "caregiver-join" && (
          <CaregiverJoinStep
            value={data.caregiverEmail}
            onChange={(v) => update({ caregiverEmail: v })}
            onNext={() => advance("caregiver-name")}
            onBack={() => retreat("role")}
            dotIndex={0} dotTotal={total}
          />
        )}

        {step === "caregiver-name" && (
          <CaregiverNameStep
            value={data.caregiverName}
            onChange={(v) => update({ caregiverName: v })}
            onNext={() => advance("caregiver-complete")}
            onBack={() => retreat("caregiver-join")}
            dotIndex={1} dotTotal={total}
          />
        )}

        {step === "caregiver-complete" && <CaregiverCompleteStep data={data} />}

      </motion.div>
    </AnimatePresence>
  );
}
