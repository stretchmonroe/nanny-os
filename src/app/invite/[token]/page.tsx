"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import SproutMark from "@/components/brand/SproutMark";
import { signUpUser, signInUser } from "@/lib/supabase/household";
import { supabase } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InviteData {
  found:           boolean;
  reason?:         string;
  invite_id?:      string;
  email?:          string;
  role?:           string;
  household_name?: string;
  child_name?:     string;
  invited_by_name?: string;
  expires_at?:     string;
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "15px 18px", fontSize: 16, fontWeight: 500,
  border: "1.5px solid rgba(42,105,101,0.15)", borderRadius: 16,
  background: "white", color: "#261E18",
  boxShadow: "0 2px 10px rgba(42,105,101,0.05)",
  boxSizing: "border-box" as const, outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};
function onFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(42,105,101,0.45)";
  e.target.style.boxShadow   = "0 2px 16px rgba(42,105,101,0.12)";
}
function onBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = "rgba(42,105,101,0.15)";
  e.target.style.boxShadow   = "0 2px 10px rgba(42,105,101,0.05)";
}

// ── Invite card (shown above the form) ────────────────────────────────────────

function InviteCard({ invite }: { invite: InviteData }) {
  const childName      = invite.child_name     || "your little one";
  const householdName  = invite.household_name || "";
  const inviterName    = invite.invited_by_name || "";

  return (
    <div
      style={{
        borderRadius: 24, padding: "24px 22px", marginBottom: 28,
        background:   "linear-gradient(145deg, #EFE0C0 0%, #FAF4E8 100%)",
        border:       "1px solid rgba(180,130,50,0.14)",
        position:     "relative", overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute", top: -4, right: -4,
          fontSize: 64, opacity: 0.10, transform: "rotate(12deg)",
          userSelect: "none", pointerEvents: "none", lineHeight: 1,
        }}
        aria-hidden
      >🌱</span>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <SproutMark size={28} />
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(42,105,101,0.55)", textTransform: "uppercase", letterSpacing: "0.13em", margin: 0 }}>
            Ankur · Care circle invite
          </p>
          {householdName && (
            <p style={{ fontSize: 11, color: "rgba(42,105,101,0.45)", margin: "2px 0 0", fontWeight: 500 }}>
              {householdName}
            </p>
          )}
        </div>
      </div>

      <p style={{ fontSize: 22, fontWeight: 800, color: "#261E18", margin: "0 0 8px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
        Join {childName}&apos;s care circle
      </p>

      {inviterName ? (
        <p style={{ fontSize: 13.5, color: "#7A6D62", margin: 0, lineHeight: 1.5 }}>
          {inviterName} is inviting you to be part of the circle of people
          who show up for {childName} every day.
        </p>
      ) : (
        <p style={{ fontSize: 13.5, color: "#7A6D62", margin: 0, lineHeight: 1.5 }}>
          You&apos;ve been invited to care for {childName} — a trusted person
          in their daily life.
        </p>
      )}
    </div>
  );
}

// ── Auth form ─────────────────────────────────────────────────────────────────

interface AuthFormProps {
  invite:    InviteData;
  token:     string;
  onSuccess: (householdId: string) => void;
}

function AuthForm({ invite, token, onSuccess }: AuthFormProps) {
  const [mode,        setMode]        = useState<"up" | "in">("up");
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState(invite.email ?? "");
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validPw    = password.length >= 8;
  const canSubmit  = validEmail && validPw && (mode === "in" || name.trim().length > 0) && !loading;

  async function accept(userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/invites/caregiver/accept", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ token, display_name: name.trim() || undefined }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Couldn't join household");
    onSuccess(json.household_id);
  }

  async function handleSignUp() {
    if (!canSubmit) return;
    setError(""); setLoading(true);
    try {
      const result = await signUpUser(email, password, name.trim());
      if ("error" in result) {
        if (result.error.includes("already has an account")) setMode("in");
        throw new Error(result.error);
      }
      await accept(result.userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleSignIn() {
    if (!canSubmit) return;
    setError(""); setLoading(true);
    try {
      const result = await signInUser(email, password);
      if ("error" in result) throw new Error(result.error);
      await accept(result.userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const handle = mode === "up" ? handleSignUp : handleSignIn;

  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: "#261E18", margin: "0 0 20px" }}>
        {mode === "up" ? "Create your account to join" : "Sign in to join"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "up" && (
          <input
            autoFocus={mode === "up"}
            type="text" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your first name…"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur}
          />
        )}

        <input
          autoFocus={mode === "in"}
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          placeholder="Email address…"
          autoCapitalize="none" autoComplete="email"
          style={inputStyle} onFocus={onFocus} onBlur={onBlur}
        />

        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"} value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") handle(); }}
            placeholder={mode === "in" ? "Your password…" : "Create a password…"}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            style={{ ...inputStyle, paddingRight: 50 }}
            onFocus={onFocus} onBlur={onBlur}
          />
          <button
            type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(42,105,101,0.45)" }}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {mode === "up" && (
          <p style={{ fontSize: 12, color: "rgba(42,105,101,0.45)", margin: "0 0 4px", fontWeight: 500 }}>
            At least 8 characters.
          </p>
        )}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: 13, color: "#C0392B", fontWeight: 600, margin: "10px 0 0" }}
        >
          {error}
        </motion.p>
      )}

      <button
        onClick={handle}
        disabled={!canSubmit}
        style={{
          width: "100%", marginTop: 20, padding: "16px", borderRadius: 16, border: "none",
          background: "#2A6965", color: "white", fontSize: 15, fontWeight: 700,
          cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.45,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "opacity 0.2s ease",
        }}
      >
        {loading
          ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
          : null
        }
        {loading
          ? "Joining…"
          : mode === "up"
          ? `Join ${invite.child_name || "the"} care circle →`
          : "Sign in and join →"
        }
      </button>

      <button
        onClick={() => { setMode(m => m === "up" ? "in" : "up"); setError(""); }}
        style={{ width: "100%", marginTop: 12, padding: "12px", border: "none", background: "none", fontSize: 13, fontWeight: 600, color: "rgba(42,105,101,0.45)", cursor: "pointer" }}
      >
        {mode === "up" ? "Already have an account? Sign in" : "Don't have an account? Create one"}
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token  = typeof params.token === "string" ? params.token : "";

  const [invite,   setInvite]   = useState<InviteData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invites/caregiver/${token}`)
      .then(r => r.json())
      .then((d: InviteData) => setInvite(d))
      .catch(() => setInvite({ found: false }))
      .finally(() => setLoading(false));
  }, [token]);

  function onSuccess() {
    setAccepted(true);
    // Give auth session a moment to propagate before navigating
    setTimeout(() => router.replace("/home"), 1600);
  }

  const childName = invite?.child_name || "your little one";

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: "#F4EFE8" }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "20px 24px 0", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(42,105,101,0.09)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowLeft size={15} strokeWidth={2} color="rgba(42,105,101,0.6)" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SproutMark size={22} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase" as const, letterSpacing: "0.13em" }}>
              Sprout by Ankur
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "32px 24px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <AnimatePresence mode="wait">

            {/* Loading */}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}
              >
                <span style={{ width: 22, height: 22, border: "2.5px solid rgba(42,105,101,0.18)", borderTopColor: "#2A6965", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              </motion.div>
            )}

            {/* Not found */}
            {!loading && invite && !invite.found && (
              <motion.div key="not-found" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", padding: "0 12px" }}
              >
                <div style={{ fontSize: 48, marginBottom: 20 }}>🍂</div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#261E18", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                  {invite.reason === "expired" ? "This invite has expired" : "Invite not found"}
                </p>
                <p style={{ fontSize: 14, color: "#7A6D62", lineHeight: 1.55, margin: "0 0 32px" }}>
                  {invite.reason === "expired"
                    ? "Invite links are valid for 7 days. Ask the parent to send a new one."
                    : "This link doesn't match any active invite. It may have been used or cancelled."}
                </p>
                <button
                  onClick={() => router.replace("/onboarding")}
                  style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#2A6965", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                >
                  Back to Ankur
                </button>
              </motion.div>
            )}

            {/* Accepted */}
            {accepted && (
              <motion.div key="accepted" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                style={{ textAlign: "center", padding: "0 12px" }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(42,105,101,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}
                >
                  <Check size={36} strokeWidth={2.5} color="#2A6965" />
                </motion.div>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#261E18", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
                  You&apos;re in! 🌱
                </p>
                <p style={{ fontSize: 14, color: "#7A6D62", lineHeight: 1.55, margin: 0 }}>
                  Welcome to {childName}&apos;s care circle.
                  <br />Heading to your home now…
                </p>
              </motion.div>
            )}

            {/* Main flow: invite found + not yet accepted */}
            {!loading && invite?.found && !accepted && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <InviteCard invite={invite} />
                <AuthForm invite={invite} token={token} onSuccess={onSuccess} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
