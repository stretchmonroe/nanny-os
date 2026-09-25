"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

export default function JoinPage() {
  const router = useRouter();
  const { currentUserRole, profileFullName, activeChild, setCurrentUserRole, setActiveChild } = useAppStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (currentUserRole === "nanny" && profileFullName && activeChild) router.replace("/home");
  }, [currentUserRole, profileFullName, activeChild, router]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in to enter your invite code.");
      const res = await fetch("/api/invite/claim", {
        method: "POST",
        headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not join home");
      if (!data.child) throw new Error("Joined successfully. Reload to load your home.");
      sessionStorage.removeItem("ankur-invited-signup");
      setActiveChild({ id: String(data.child.id), name: data.child.name, birthDate: data.child.birth_date ?? null });
      setCurrentUserRole("nanny");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join home");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface-page px-6 pt-20">
      <div className="mx-auto max-w-sm">
        <h1 className="text-3xl font-black text-foreground">Join your care circle</h1>
        {currentUserRole === "nanny" ? (
          <p className="mt-4 text-muted-foreground">You’ve joined. Add your name to continue.</p>
        ) : (
          <form onSubmit={join} className="mt-7 space-y-4">
            <p className="text-sm text-muted-foreground">Enter the code the parent shared with you.</p>
            <label htmlFor="join-code" className="block text-sm font-semibold">Invite code</label>
            <input id="join-code" required autoComplete="off" value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX" maxLength={19}
              className="w-full rounded-xl border border-border bg-surface-card p-4 font-mono text-lg text-foreground" />
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy || !code.trim()}
              className="w-full rounded-xl bg-foreground p-4 font-bold text-white disabled:opacity-40">
              {busy ? "Joining…" : "Join home"}
            </button>
            <button type="button" onClick={() => router.push("/setup")}
              className="w-full p-3 text-sm text-muted-foreground">Set up a different home</button>
          </form>
        )}
      </div>
    </main>
  );
}
