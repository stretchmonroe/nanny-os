"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Screen = "welcome" | "signup" | "signin" | "done";

const wrap: React.CSSProperties = {
  minHeight: "100dvh", background: "#F4EFE8",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  padding: "40px 28px", maxWidth: 480, margin: "0 auto",
};

const card: React.CSSProperties = {
  width: "100%", maxWidth: 360,
  display: "flex", flexDirection: "column", gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px",
  fontSize: 15, fontWeight: 500, boxSizing: "border-box",
  border: "1.5px solid rgba(42,105,101,0.18)", borderRadius: 14,
  background: "white", color: "#261E18", outline: "none",
};

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "14px", borderRadius: 14, border: "none",
  background: "#2A6965", color: "white", fontSize: 15, fontWeight: 700,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  width: "100%", padding: "12px", borderRadius: 14, border: "none",
  background: "none", color: "#6A9C80", fontSize: 14, fontWeight: 600,
  cursor: "pointer",
};

const heading: React.CSSProperties = {
  fontSize: 26, fontWeight: 800, color: "#261E18",
  margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.25,
};

const sub: React.CSSProperties = {
  fontSize: 14, color: "#7A6D62", margin: "0 0 20px", lineHeight: 1.5,
};

const errStyle: React.CSSProperties = {
  fontSize: 13, color: "#C0392B", fontWeight: 600, margin: 0,
};

export function HouseholdFlow() {
  const [screen,   setScreen]   = useState<Screen>("welcome");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // SIGNED_IN event fires → useAuthInit → /home
    setScreen("done");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    // SIGNED_IN event fires → useAuthInit → /home
    setScreen("done");
  }

  if (screen === "done") {
    return (
      <div style={wrap}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <p style={{ fontSize: 16, color: "#7A6D62" }}>Getting your home ready…</p>
        </div>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <h1 style={heading}>Welcome to Ankur</h1>
            <p style={sub}>A shared space for everyone who cares for your little one.</p>
          </div>
          <button style={btnPrimary} onClick={() => setScreen("signup")}>
            Create an account
          </button>
          <button style={btnGhost} onClick={() => setScreen("signin")}>
            I already have an account
          </button>
        </div>
      </div>
    );
  }

  if (screen === "signup") {
    return (
      <div style={wrap}>
        <form style={card} onSubmit={handleSignUp}>
          <h1 style={heading}>Create account</h1>
          <p style={sub}>Enter your email and choose a password.</p>
          <input
            style={inputStyle} type="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
          />
          <input
            style={inputStyle} type="password" placeholder="Password (min 6 chars)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={6} autoComplete="new-password"
          />
          {error && <p style={errStyle}>{error}</p>}
          <button style={btnPrimary} type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Continue"}
          </button>
          <button style={btnGhost} type="button" onClick={() => setScreen("welcome")}>
            Back
          </button>
        </form>
      </div>
    );
  }

  // signin
  return (
    <div style={wrap}>
      <form style={card} onSubmit={handleSignIn}>
        <h1 style={heading}>Sign in</h1>
        <p style={sub}>Welcome back.</p>
        <input
          style={inputStyle} type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          required autoComplete="email"
        />
        <input
          style={inputStyle} type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          required autoComplete="current-password"
        />
        {error && <p style={errStyle}>{error}</p>}
        <button style={btnPrimary} type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <button style={btnGhost} type="button" onClick={() => setScreen("welcome")}>
          Back
        </button>
      </form>
    </div>
  );
}
