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

function deriveCode(householdId: string) {
  // First UUID segment (8 chars before first dash), uppercased.
  const seg = householdId.split("-")[0].toUpperCase();
  return `${seg.slice(0, 4)}-${seg.slice(4, 8)}`;
}

export default function CareCirclePage() {
  const { profileFullName, currentUserRole, activeChild } = useAppStore();
  const [members,     setMembers]     = useState<Member[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting,    setInviting]    = useState(false);
  const [inviteErr,   setInviteErr]   = useState("");
  const [inviteDone,  setInviteDone]  = useState(false);
  const [copied,      setCopied]      = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !user) { setLoading(false); return; }

    const res = await fetch("/api/care-circle", {
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
      setHouseholdId(data.householdId ?? null);
    }
    setLoading(false);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteErr("");
    setInviting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setInviting(false); return; }

    const res = await fetch("/api/care-circle/invite", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: inviteEmail }),
    });

    if (res.ok) {
      setInviteDone(true);
      setInviteEmail("");
    } else {
      const body = await res.json().catch(() => ({}));
      setInviteErr(body.error ?? "Something went wrong");
    }
    setInviting(false);
  }

  function copyCode() {
    if (!householdId) return;
    const code = deriveCode(householdId);
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareCode() {
    if (!householdId) return;
    const code = deriveCode(householdId);
    const text = `Join ${activeChild?.name ? `${activeChild.name}'s` : "our"} home on Ankur with code: ${code}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isParent = currentUserRole === "parent";
  const inviteCode = householdId ? deriveCode(householdId) : null;

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
        {!loading && isParent && inviteCode && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
              Invite code
            </p>
            <div className="bg-surface-card border-soft rounded-2xl px-5 py-5 shadow-card space-y-4">
              <div>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                  Share this code with your nanny. They enter it in the app when setting up their account.
                </p>
                {/* Code display */}
                <div className="flex items-center justify-between bg-surface-raised rounded-2xl px-5 py-4">
                  <span className="text-[28px] font-black text-foreground tracking-[0.12em] font-mono">
                    {inviteCode}
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
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Email invite — parents only */}
        {!loading && isParent && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
              Invite by email
            </p>
            {inviteDone ? (
              <div className="bg-surface-card border-soft rounded-2xl px-4 py-5 shadow-card text-center">
                <p className="text-[22px] mb-1">🌱</p>
                <p className="text-[14px] font-semibold text-foreground">Invite sent</p>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  Ask your caregiver to sign up with that email address.
                </p>
                <button
                  onClick={() => setInviteDone(false)}
                  className="mt-3 text-[13px] font-semibold text-muted-foreground underline"
                >
                  Invite another
                </button>
              </div>
            ) : (
              <form
                onSubmit={sendInvite}
                className="bg-surface-card border-soft rounded-2xl px-4 py-4 shadow-card space-y-3"
              >
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Enter your caregiver&apos;s email. They sign up with that address to join automatically.
                </p>
                <input
                  type="email"
                  required
                  placeholder="caregiver@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-muted rounded-xl px-4 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
                {inviteErr && (
                  <p className="text-[13px] font-semibold text-red-500">{inviteErr}</p>
                )}
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="w-full bg-foreground text-white font-bold text-[14px] py-3 rounded-xl disabled:opacity-40 transition-opacity"
                >
                  {inviting ? "Sending…" : "Send invite"}
                </button>
              </form>
            )}
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
