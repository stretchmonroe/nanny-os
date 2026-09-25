"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { Copy, Share2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Member = {
  role: string;
  display_name: string | null;
  email: string | null;
  is_me: boolean;
};

const roleLabel: Record<string, string> = {
  parent: "Parent",
  nanny:  "Nanny",
  caregiver:   "Caregiver",
  grandparent: "Grandparent",
};

const roleEmoji: Record<string, string> = {
  parent:      "🏠",
  nanny:       "🌱",
  caregiver:   "🤲",
  grandparent: "👴",
};

export default function CareCirclePage() {
  const { profileFullName, currentUserRole, activeChild } = useAppStore();
  const [members,     setMembers]     = useState<Member[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [inviteCode, setInviteCode]   = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry]   = useState<string | null>(null);
  const [codeBusy,   setCodeBusy]     = useState(false);
  const [codeError,  setCodeError]    = useState("");
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !user) { if (!cancelled) setLoading(false); return; }

      const res = await fetch("/api/care-circle", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (!cancelled && res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
        if (data.householdId && data.members?.some((member: Member) => member.is_me && member.role === "parent")) {
          const codeRes = await fetch("/api/care-circle/code", {
            headers: { authorization: `Bearer ${session.access_token}` },
          });
          if (!cancelled && codeRes.ok) {
            const codeData = await codeRes.json();
            setInviteCode(codeData.code ?? null);
            setCodeExpiry(codeData.expiresAt ?? null);
          } else if (!cancelled) setCodeError("Could not load the invite code. Refresh to try again.");
        }
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function generateCode() {
    setCodeError("");
    setCodeBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCodeError("Sign in to manage invite codes."); setCodeBusy(false); return; }
    const res = await fetch("/api/care-circle/code", {
      method: "POST",
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setInviteCode(data.code);
      setCodeExpiry(data.expiresAt);
    } else {
      setCodeError("Could not generate an invite code. Please try again.");
    }
    setCodeBusy(false);
  }

  function copyCode() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareCode() {
    if (!inviteCode) return;
    const text = `Join ${activeChild?.name ? `${activeChild.name}'s` : "our"} home on Ankur: ${window.location.origin}/onboarding — choose "I was invited to join" and enter code ${inviteCode.match(/.{1,4}/g)?.join("-")}.`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isParent = currentUserRole === "parent";

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div
        className="px-5 pt-7 pb-5 border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
          Care Circle
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1 font-medium">
          {activeChild?.name ? `Everyone caring for ${activeChild.name}` : "Your household"}
        </p>
      </div>

      <div className="px-4 pt-5 pb-20 space-y-6">
        {loading && (
          <p className="text-[13px] text-muted-foreground pt-4">Loading…</p>
        )}

        {/* Members */}
        {!loading && members.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
              Members
            </p>
            <div className="space-y-2">
              {members.map((m, i) => (
                <MemberCard key={i} member={m} profileFullName={profileFullName} />
              ))}
            </div>
          </section>
        )}

        {/* Invite code — parents only */}
        {!loading && isParent && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
              Caregiver invite code
            </p>
            <div className="bg-surface-card border-soft rounded-2xl px-5 py-5 shadow-card space-y-4">
              <div>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                  Share this code with a caregiver. They create an account with their own email, enter the code, and add their name. It expires after seven days.
                </p>
                {inviteCode && <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-raised rounded-2xl px-4 py-4">
                  <span className="text-[20px] font-black text-foreground tracking-[0.04em] font-mono">
                    {inviteCode.match(/.{1,4}/g)?.join("-")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyCode}
                      className={cn(
                        "flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-all active:scale-95",
                        copied
                          ? "bg-sage-light text-sage"
                          : "bg-surface-card border-soft text-muted-foreground"
                      )}
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={shareCode}
                      className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl bg-surface-card border-soft text-muted-foreground active:scale-95 transition-all"
                    >
                      <Share2 size={13} />
                      Share
                    </button>
                  </div>
                </div>}
                {codeExpiry && inviteCode && <p className="text-xs text-muted-foreground">Expires {new Date(codeExpiry).toLocaleDateString()}</p>}
                {codeError && <p role="alert" className="text-sm text-red-600">{codeError}</p>}
                <button onClick={generateCode} disabled={codeBusy}
                  className="text-sm font-semibold text-sage disabled:opacity-40">
                  {codeBusy ? "Generating…" : inviteCode ? "Generate a new code (old code stops working)" : "Generate invite code"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Empty state for nanny with no household */}
        {!loading && members.length === 0 && !isParent && (
          <div className="pt-10 flex flex-col items-center gap-2 text-center px-6">
            <span className="text-4xl">🏡</span>
            <p className="text-[15px] font-semibold text-foreground mt-2">Not in a household yet</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Ask the parent to share their invite code, then tap the menu and choose Create Your Home.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberCard({
  member,
  profileFullName,
}: {
  member: Member;
  profileFullName: string | null;
}) {
  const name = member.is_me
    ? (profileFullName ?? member.email ?? "You")
    : (member.display_name ?? member.email ?? "Unnamed");

  return (
    <div className="bg-surface-card border-soft rounded-2xl px-4 py-3.5 shadow-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-surface-raised flex items-center justify-center text-[18px] shrink-0">
        {roleEmoji[member.role] ?? "👤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-foreground truncate">{name}</p>
          {member.is_me && (
            <span className="text-[10px] font-bold text-muted-foreground bg-surface-raised px-1.5 py-0.5 rounded-full shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground">
          {roleLabel[member.role] ?? member.role}
        </p>
      </div>
    </div>
  );
}
