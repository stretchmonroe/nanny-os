"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  onDismiss: () => void;
}

export function ProfileSetupCard({ onDismiss }: Props) {
  const setActiveChild = useAppStore((s) => s.setActiveChild);

  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!childName.trim()) return;
    setError("");
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await fetch("/api/setup", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ child_name: childName.trim(), birth_date: birthDate || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong");
      }

      const { child } = await res.json();
      setActiveChild({ id: String(child.id), name: child.name, birthDate: child.birth_date ?? null });
      // Card disappears when activeChild is set — no explicit close needed.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      margin: "0 16px",
      borderRadius: 20,
      background: "#EAF2EC",
      border: "1.5px solid rgba(106,156,128,0.2)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 16px 0" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            🌱 Set up your home
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 800, color: "#261E18", lineHeight: 1.25 }}>
            Who are you caring for?
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#7A6D62", lineHeight: 1.4 }}>
            Just a name to get started — everything else is optional.
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Do this later"
          style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#A4C2B0", flexShrink: 0, marginTop: -2, marginRight: -4 }}
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={save} style={{ padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Child&apos;s name
          </p>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Sofia"
            required
            style={{
              width: "100%", padding: "11px 14px", fontSize: 15, fontWeight: 500,
              border: "1.5px solid rgba(106,156,128,0.2)", borderRadius: 14,
              background: "white", color: "#261E18", boxSizing: "border-box", outline: "none",
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = "rgba(106,156,128,0.5)"; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = "rgba(106,156,128,0.2)"; }}
          />
        </div>

        <div>
          <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "#6A9C80", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Birthday <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "#A4C2B0" }}>— optional</span>
          </p>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{
              width: "100%", padding: "11px 14px", fontSize: 15, fontWeight: 500,
              border: "1.5px solid rgba(106,156,128,0.2)", borderRadius: 14,
              background: "white", color: "#261E18", boxSizing: "border-box", outline: "none",
            }}
            onFocus={(e)  => { e.currentTarget.style.borderColor = "rgba(106,156,128,0.5)"; }}
            onBlur={(e)   => { e.currentTarget.style.borderColor = "rgba(106,156,128,0.2)"; }}
          />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: 13, color: "#C0392B", fontWeight: 600 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !childName.trim()}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
            background: childName.trim() && !loading ? "#6A9C80" : "rgba(106,156,128,0.35)",
            color: "white", fontSize: 14, fontWeight: 700,
            cursor: childName.trim() && !loading ? "pointer" : "default",
            transition: "background 0.2s ease",
          }}
        >
          {loading ? "Setting up…" : "Set up home"}
        </button>

        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none", border: "none", width: "100%",
            fontSize: 13, fontWeight: 500, color: "#A4C2B0",
            cursor: "pointer", padding: "2px 0",
          }}
        >
          Do this later
        </button>
      </form>
    </div>
  );
}
