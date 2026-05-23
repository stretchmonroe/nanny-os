"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

type Member = {
  id: string;
  role: string;
  status: string;
  display_name: string | null;
  email: string | null;
  invited_email: string | null;
  is_me: boolean;
};

const roleLabel: Record<string, string> = {
  parent:      "Parent",
  caregiver:   "Caregiver",
  grandparent: "Grandparent",
};

const roleEmoji: Record<string, string> = {
  parent:      "🏡",
  caregiver:   "🤲",
  grandparent: "👴",
};

export default function CareCirclePage() {
  const { profileFullName, currentUserRole, activeChild } = useAppStore();
  const [members,     setMembers]     = useState<Member[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting,    setInviting]    = useState(false);
  const [inviteErr,   setInviteErr]   = useState("");
  const [inviteDone,  setInviteDone]  = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const res = await fetch("/api/care-circle", {
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const { members: data } = await res.json();
      setMembers(data ?? []);
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
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setInviteErr(body.error ?? "Something went wrong");
    }
    setInviting(false);
  }

  const isParent = currentUserRole === "parent";
  const activeMembers  = members.filter((m) => m.status === "active");
  const pendingInvites = members.filter((m) => m.status === "invited");

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

      <div className="px-4 pt-5 pb-16 space-y-6">
        {loading && (
          <p className="text-[13px] text-muted-foreground pt-4">Loading…</p>
        )}

        {/* Active members */}
        {!loading && activeMembers.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Members
            </p>
            <div className="space-y-2">
              {activeMembers.map((m) => (
                <MemberCard key={m.id} member={m} profileFullName={profileFullName} />
              ))}
            </div>
          </section>
        )}

        {/* Pending invites */}
        {!loading && pendingInvites.length > 0 && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Pending
            </p>
            <div className="space-y-2">
              {pendingInvites.map((m) => (
                <div
                  key={m.id}
                  className="bg-surface-card border-soft rounded-2xl px-4 py-3.5 shadow-card flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-[18px] shrink-0">
                    {roleEmoji[m.role] ?? "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {m.invited_email}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {roleLabel[m.role] ?? m.role} · Invite pending
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/30 px-2.5 py-1 rounded-full shrink-0">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invite form — only parents, no existing caregiver */}
        {!loading && isParent && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Invite caregiver
            </p>
            {inviteDone ? (
              <div className="bg-surface-card border-soft rounded-2xl px-4 py-4 shadow-card text-center">
                <p className="text-[22px] mb-1">🌱</p>
                <p className="text-[14px] font-semibold text-foreground">Invite created</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Share the app with your caregiver and ask them to sign up with that email.
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
                  Enter your caregiver&apos;s email. They&apos;ll sign up with that address to join your household.
                </p>
                <input
                  type="email"
                  required
                  placeholder="caregiver@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-muted rounded-xl px-4 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none border-soft focus:ring-1 focus:ring-foreground/20"
                />
                {inviteErr && (
                  <p className="text-[13px] font-semibold text-red-500">{inviteErr}</p>
                )}
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="w-full bg-foreground text-background font-bold text-[14px] py-3 rounded-xl disabled:opacity-40 transition-opacity"
                >
                  {inviting ? "Sending…" : "Send invite"}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Empty state — no household set up */}
        {!loading && members.length === 0 && !isParent && (
          <div className="pt-10 flex flex-col items-center gap-2 text-center">
            <span className="text-4xl">🏡</span>
            <p className="text-[15px] font-semibold text-foreground mt-2">No household yet</p>
            <p className="text-[13px] text-muted-foreground max-w-[220px]">
              Set up your home from the Home tab to get started.
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
      <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-[18px] shrink-0">
        {roleEmoji[member.role] ?? "👤"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-foreground truncate">{name}</p>
          {member.is_me && (
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
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
