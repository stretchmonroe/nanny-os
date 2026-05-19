"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, UserPlus, Clock, Mail,
  MoreHorizontal, Trash2, RefreshCw, X, Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Member {
  user_id:      string;
  role:         "parent" | "nanny";
  joined_at:    string;
  display_name: string;
  email:        string;
  is_self:      boolean;
}

interface Invite {
  id:           string;
  email:        string;
  inviter_name: string | null;
  note:         string | null;
  created_at:   string;
  expires_at:   string;
}

interface CircleData {
  demo:           boolean;
  household_id:   string | null;
  household_name: string;
  child_name:     string;
  your_name:      string;
  is_parent:      boolean;
  members:        Member[];
  invites:        Invite[];
}

const DEMO: CircleData = {
  demo:           true,
  household_id:   null,
  household_name: "The Johnson Family",
  child_name:     "Sofia",
  your_name:      "Elena",
  is_parent:      false,
  members: [
    {
      user_id:      "demo-1",
      role:         "parent",
      joined_at:    new Date().toISOString(),
      display_name: "Maria",
      email:        "maria@example.com",
      is_self:      false,
    },
    {
      user_id:      "demo-2",
      role:         "nanny",
      joined_at:    new Date().toISOString(),
      display_name: "Elena",
      email:        "elena@example.com",
      is_self:      true,
    },
  ],
  invites: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function roleLabel(role: "parent" | "nanny") {
  return role === "parent" ? "Parent" : "Caregiver";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(seed: string) {
  const palette = [
    ["#D4A882", "#F5D9A8"],
    ["#8BAAC6", "#C8DCF0"],
    ["#A4C2B0", "#D4EDDA"],
    ["#B8A0D4", "#E8E0F4"],
    ["#D4906A", "#F0C4A0"],
  ];
  const i = seed.charCodeAt(0) % palette.length;
  return palette[i];
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

// ── Invite sheet ───────────────────────────────────────────────────────────────

interface InviteSheetProps {
  open:          boolean;
  onClose():     void;
  householdId:   string;
  yourName:      string;
  childName:     string;
  onSent():      void;
  initialEmail?: string;
}

function InviteSheet({
  open, onClose, householdId, yourName, childName, onSent, initialEmail,
}: InviteSheetProps) {
  const [email,   setEmail]   = useState(initialEmail ?? "");
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (open) { setEmail(initialEmail ?? ""); setNote(""); setError(""); }
  }, [open, initialEmail]);

  async function send() {
    if (!email.trim()) return;
    setError(""); setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      await fetch("/api/invites/send", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          email:        email.trim().toLowerCase(),
          household_id: householdId,
          inviter_name: yourName,
          child_name:   childName,
          note:         note.trim() || null,
        }),
      });
      onSent();
      onClose();
      setEmail(""); setNote("");
    } catch {
      setError("Couldn't send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="invite-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.div
            key="invite-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-md mx-auto rounded-t-[2rem] px-6 pt-5 pb-10"
            style={{ background: "var(--surface-card)" }}
          >
            {/* Handle */}
            <div className="w-9 h-1 rounded-full mx-auto mb-5 opacity-20"
              style={{ background: "var(--text-primary)" }} />

            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[17px] font-bold text-foreground">Invite a caregiver</p>
                <p className="text-[12px] text-muted-foreground/60 mt-0.5">
                  They&apos;ll get a link to join {childName}&apos;s care circle
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.07)" }}
              >
                <X size={12} strokeWidth={2.2} className="text-foreground/40" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="caregiver@example.com"
                  className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/35 outline-none"
                  style={{
                    background: "var(--surface-raised)",
                    border:     "1px solid var(--border-soft)",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">
                  Personal note <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`Looking forward to having you in ${childName}'s care circle…`}
                  rows={2}
                  className="w-full rounded-xl px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/35 outline-none resize-none"
                  style={{
                    background: "var(--surface-raised)",
                    border:     "1px solid var(--border-soft)",
                  }}
                />
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-red-500/80 mt-2">{error}</p>
            )}

            <button
              onClick={send}
              disabled={!email.trim() || loading}
              className="mt-4 w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} strokeWidth={2} />
              )}
              Send invite
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Member card ────────────────────────────────────────────────────────────────

interface MemberCardProps {
  member:    Member;
  isParent:  boolean;
  onRemove(userId: string): void;
}

function MemberCard({ member, isParent, onRemove }: MemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [from, to] = avatarColor(member.display_name);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl relative"
      style={{
        background: "var(--surface-card)",
        boxShadow:  "var(--shadow-card)",
        border:     "1px solid var(--border-soft)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-[1rem] flex items-center justify-center text-[13px] font-bold text-white shrink-0"
        style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: "#fff" }}
      >
        {initials(member.display_name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-foreground truncate">
            {member.display_name}
            {member.is_self && (
              <span className="text-muted-foreground/40 font-normal"> (you)</span>
            )}
          </p>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: member.role === "parent"
                ? "var(--trust-light)"
                : "var(--sage-light)",
              color: member.role === "parent"
                ? "var(--trust)"
                : "var(--sage)",
            }}
          >
            {roleLabel(member.role)}
          </span>
        </div>
        <p className="text-[11.5px] text-muted-foreground/45 truncate mt-0.5">
          {member.email}
        </p>
      </div>

      {/* Actions — parents can remove non-self nannies */}
      {isParent && !member.is_self && member.role === "nanny" && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:bg-border/30"
          >
            <MoreHorizontal size={14} className="text-muted-foreground/35" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[10]"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-[20] rounded-xl overflow-hidden shadow-elevated"
                  style={{
                    background: "var(--surface-card)",
                    border:     "1px solid var(--border-soft)",
                    minWidth:   "148px",
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); onRemove(member.user_id); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-red-500/80 active:bg-red-50/50"
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                    Remove caregiver
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Pending invite card ────────────────────────────────────────────────────────

interface InviteCardProps {
  invite:     Invite;
  isParent:   boolean;
  householdId: string;
  yourName:   string;
  childName:  string;
  onCancel(id: string): void;
  onResend(email: string): void;
}

function InviteCard({ invite, isParent, onCancel, onResend }: InviteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const days = daysUntil(invite.expires_at);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl relative"
      style={{
        background: "var(--surface-card)",
        boxShadow:  "var(--shadow-card)",
        border:     "1px solid var(--border-soft)",
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0"
        style={{ background: "var(--surface-raised)" }}
      >
        <Mail size={16} strokeWidth={1.6} className="text-muted-foreground/40" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground truncate">
          {invite.email}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock size={10} className="text-muted-foreground/35 shrink-0" />
          <p className="text-[11px] text-muted-foreground/45">
            Invite expires in {days} day{days !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Actions */}
      {isParent && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:bg-border/30"
          >
            <MoreHorizontal size={14} className="text-muted-foreground/35" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[10]"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-[20] rounded-xl overflow-hidden shadow-elevated"
                  style={{
                    background: "var(--surface-card)",
                    border:     "1px solid var(--border-soft)",
                    minWidth:   "148px",
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); onResend(invite.email); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-foreground/70 active:bg-border/20 border-b"
                    style={{ borderColor: "var(--border-soft)" }}
                  >
                    <RefreshCw size={13} strokeWidth={1.8} />
                    Resend invite
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onCancel(invite.id); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-red-500/80 active:bg-red-50/50"
                  >
                    <X size={13} strokeWidth={1.8} />
                    Cancel invite
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CareCirclePage() {
  const router = useRouter();
  const [data,        setData]        = useState<CircleData>(DEMO);
  const [loading,     setLoading]     = useState(true);
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [resendEmail, setResendEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/care-circle", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch {
      // keep demo
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function removeMember(userId: string) {
    setData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.user_id !== userId),
    }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/care-circle/remove-member", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
    } catch {
      load(); // rollback
    }
  }

  async function cancelInvite(inviteId: string) {
    setData((prev) => ({
      ...prev,
      invites: prev.invites.filter((i) => i.id !== inviteId),
    }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/care-circle/cancel-invite", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ invite_id: inviteId }),
      });
    } catch {
      load(); // rollback
    }
  }

  function openResend(email: string) {
    setResendEmail(email);
    setInviteOpen(true);
  }

  const parents   = data.members.filter((m) => m.role === "parent");
  const nannies   = data.members.filter((m) => m.role === "nanny");
  const hasInvites = data.invites.length > 0;

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: "var(--surface-page)" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 pt-12 pb-4"
        style={{
          background:   "var(--surface-header)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: "rgba(0,0,0,0.06)" }}
          >
            <ArrowLeft size={15} strokeWidth={2} className="text-foreground/60" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-foreground leading-tight">
              Care circle
            </h1>
            {!data.demo && data.household_name && (
              <p className="text-[11.5px] text-muted-foreground/50 mt-0.5">
                {data.household_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-24">
          <span className="w-6 h-6 border-2 border-border border-t-muted-foreground rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 pt-5 space-y-6">

          {/* Parents */}
          {parents.length > 0 && (
            <section>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40 mb-2 px-1">
                Parents
              </p>
              <div className="space-y-2">
                {parents.map((m) => (
                  <MemberCard
                    key={m.user_id}
                    member={m}
                    isParent={data.is_parent}
                    onRemove={removeMember}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Caregivers */}
          {nannies.length > 0 && (
            <section>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40 mb-2 px-1">
                Caregivers
              </p>
              <div className="space-y-2">
                {nannies.map((m) => (
                  <MemberCard
                    key={m.user_id}
                    member={m}
                    isParent={data.is_parent}
                    onRemove={removeMember}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Pending invites */}
          {hasInvites && (
            <section>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/40 mb-2 px-1">
                Pending invites
              </p>
              <div className="space-y-2">
                {data.invites.map((inv) => (
                  <InviteCard
                    key={inv.id}
                    invite={inv}
                    isParent={data.is_parent}
                    householdId={data.household_id ?? ""}
                    yourName={data.your_name}
                    childName={data.child_name}
                    onCancel={cancelInvite}
                    onResend={openResend}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state for nannies */}
          {nannies.length === 0 && !hasInvites && (
            <div
              className="rounded-2xl px-5 py-6 text-center"
              style={{
                background: "var(--surface-card)",
                border:     "1px solid var(--border-soft)",
              }}
            >
              <div
                className="w-11 h-11 rounded-[1rem] mx-auto flex items-center justify-center mb-3"
                style={{ background: "var(--sage-light)" }}
              >
                <Users size={18} strokeWidth={1.5} style={{ color: "var(--sage)" }} />
              </div>
              <p className="text-[14px] font-semibold text-foreground/70">
                No caregivers yet
              </p>
              <p className="text-[12px] text-muted-foreground/45 mt-1">
                Invite someone to join {data.child_name}&apos;s care circle
              </p>
            </div>
          )}

          {/* Invite CTA — parents only */}
          {data.is_parent && (
            <button
              onClick={() => { setResendEmail(null); setInviteOpen(true); }}
              className="w-full h-12 rounded-2xl flex items-center justify-center gap-2.5 text-[14px] font-semibold transition-all active:scale-[0.98]"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              <UserPlus size={15} strokeWidth={2} />
              Invite a caregiver
            </button>
          )}
        </div>
      )}

      {/* Invite sheet */}
      {data.is_parent && data.household_id && (
        <InviteSheet
          open={inviteOpen}
          onClose={() => { setInviteOpen(false); setResendEmail(null); }}
          householdId={data.household_id}
          yourName={data.your_name}
          childName={data.child_name}
          initialEmail={resendEmail ?? undefined}
          onSent={() => { load(); }}
        />
      )}
    </div>
  );
}
