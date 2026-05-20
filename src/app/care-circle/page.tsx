"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserPlus, Clock, Mail,
  MoreHorizontal, Trash2, RefreshCw, X, Send, Heart, Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

// ── Demo data — Rivera family ──────────────────────────────────────────────────

const DEMO: CircleData = {
  demo:           true,
  household_id:   null,
  household_name: "The Rivera Family",
  child_name:     "Mateo",
  your_name:      "Sofia",
  is_parent:      true,
  members: [
    {
      user_id:      "d1",
      role:         "parent",
      joined_at:    "2026-04-02T00:00:00Z",
      display_name: "Sofia Rivera",
      email:        "sofia@rivera.com",
      is_self:      true,
    },
    {
      user_id:      "d2",
      role:         "parent",
      joined_at:    "2026-04-02T00:00:00Z",
      display_name: "Marco Rivera",
      email:        "marco@rivera.com",
      is_self:      false,
    },
    {
      user_id:      "d3",
      role:         "nanny",
      joined_at:    "2026-04-08T00:00:00Z",
      display_name: "Elena Chen",
      email:        "elena@example.com",
      is_self:      false,
    },
  ],
  invites: [
    {
      id:           "inv1",
      email:        "rosa.rivera@gmail.com",
      inviter_name: "Sofia",
      note:         "Can't wait for you to be part of this!",
      created_at:   "2026-05-16T00:00:00Z",
      expires_at:   "2026-05-23T00:00:00Z",
    },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_PALETTES: [string, string][] = [
  ["#C9814A", "#E8B07A"], // amber-terra  (A–E)
  ["#5B7FA0", "#8BAAC6"], // trust-blue   (F–J)
  ["#6A9C80", "#A4C2B0"], // sage-green   (K–O)
  ["#8A7AB8", "#B8A0D4"], // lavender     (P–T)
  ["#B05A6A", "#D48A96"], // rose         (U–Z)
];

function avatarPalette(name: string): [string, string] {
  const i = name.charCodeAt(0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[i];
}

function sinceLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysUntil(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

// ── Avatar stack (hero) ────────────────────────────────────────────────────────

function AvatarStack({ members }: { members: Member[] }) {
  const shown = members.slice(0, 4);
  return (
    <div className="flex items-center">
      {shown.map((m, i) => {
        const [from, to] = avatarPalette(m.display_name);
        return (
          <div
            key={m.user_id}
            className="w-[30px] h-[30px] rounded-full border-[2.5px] flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{
              background:   `linear-gradient(135deg, ${from}, ${to})`,
              borderColor:  "var(--surface-page)",
              marginLeft:   i > 0 ? "-9px" : "0",
              zIndex:       shown.length - i,
              position:     "relative",
            }}
          >
            {initials(m.display_name)[0]}
          </div>
        );
      })}
    </div>
  );
}

// ── Member card ────────────────────────────────────────────────────────────────

interface MemberCardProps {
  member:      Member;
  isParent:    boolean;
  isPrimary?:  boolean;
  onRemove(userId: string): void;
}

function MemberCard({ member, isParent, isPrimary, onRemove }: MemberCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [from, to] = avatarPalette(member.display_name);

  const canRemove = isParent && !member.is_self && member.role === "nanny";

  return (
    <motion.div
      layout
      className="flex items-center gap-4 px-5 py-4 rounded-[1.25rem] relative overflow-hidden"
      style={{
        background: "var(--surface-card)",
        boxShadow:  "var(--shadow-card)",
        border:     "1px solid var(--border-soft)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-[52px] h-[52px] rounded-[1rem] flex items-center justify-center text-[15px] font-bold text-white shrink-0 select-none"
        style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}
      >
        {initials(member.display_name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[15px] font-semibold text-foreground leading-none">
            {member.display_name}
          </p>
          {member.is_self && (
            <span className="text-[10px] font-medium text-muted-foreground/40 bg-surface-raised px-2 py-0.5 rounded-full">
              you
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="text-[11px] font-semibold px-2.5 py-[3px] rounded-full leading-none"
            style={{
              background: member.role === "parent" ? "var(--trust-light)" : "var(--sage-light)",
              color:      member.role === "parent" ? "var(--trust)"       : "var(--sage)",
            }}
          >
            {member.role === "parent" ? "Parent" : isPrimary ? "Primary caregiver" : "Caregiver"}
          </span>
          <span className="text-[11.5px] text-muted-foreground/35 leading-none">
            Since {sinceLabel(member.joined_at)}
          </span>
        </div>

        <p className="text-[11.5px] text-muted-foreground/35 mt-1.5 truncate leading-none">
          {member.email}
        </p>
      </div>

      {/* Overflow */}
      {canRemove && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:bg-border/30 transition-colors"
          >
            <MoreHorizontal size={14} className="text-muted-foreground/30" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[10]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1,    y: 0 }}
                  exit={{   opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-[20] rounded-xl overflow-hidden"
                  style={{
                    background: "var(--surface-card)",
                    boxShadow:  "var(--shadow-elevated)",
                    border:     "1px solid var(--border-soft)",
                    minWidth:   "160px",
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); onRemove(member.user_id); }}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] text-red-500/80 active:bg-red-50/50"
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                    Remove from circle
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── Pending invite card ────────────────────────────────────────────────────────

interface InviteCardProps {
  invite:   Invite;
  isParent: boolean;
  onCancel(id: string): void;
  onResend(email: string): void;
}

function InviteCard({ invite, isParent, onCancel, onResend }: InviteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const days = daysUntil(invite.expires_at);

  return (
    <motion.div
      layout
      className="flex items-center gap-4 px-5 py-4 rounded-[1.25rem] relative"
      style={{
        background:    "rgba(251, 191, 36, 0.05)",
        border:        "1.5px dashed var(--border-medium)",
      }}
    >
      {/* Icon placeholder */}
      <div
        className="w-[52px] h-[52px] rounded-[1rem] flex items-center justify-center shrink-0"
        style={{ background: "var(--surface-raised)" }}
      >
        <Mail size={18} strokeWidth={1.4} className="text-muted-foreground/30" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground/70 truncate leading-none">
          {invite.email}
        </p>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-amber-600/70 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-[3px] rounded-full leading-none">
            Waiting to accept
          </span>
          {invite.inviter_name && (
            <span className="text-[11.5px] text-muted-foreground/35 leading-none">
              Invited by {invite.inviter_name}
            </span>
          )}
        </div>

        {invite.note && (
          <p className="text-[12px] text-muted-foreground/50 italic mt-1.5 leading-relaxed">
            &ldquo;{invite.note}&rdquo;
          </p>
        )}

        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={9} className="text-muted-foreground/30 shrink-0" />
          <p className="text-[11px] text-muted-foreground/35">
            {days === 0 ? "Expires today" : `Expires in ${days} day${days !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Overflow */}
      {isParent && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:bg-border/30 transition-colors"
          >
            <MoreHorizontal size={14} className="text-muted-foreground/30" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[10]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1,    y: 0 }}
                  exit={{   opacity: 0, scale: 0.92, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-[20] rounded-xl overflow-hidden"
                  style={{
                    background: "var(--surface-card)",
                    boxShadow:  "var(--shadow-elevated)",
                    border:     "1px solid var(--border-soft)",
                    minWidth:   "160px",
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
    </motion.div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] font-semibold text-muted-foreground/40 mb-3 px-1">
      {children}
    </p>
  );
}

// ── Invite sheet ───────────────────────────────────────────────────────────────

interface InviteSheetProps {
  open:          boolean;
  onClose():     void;
  householdId:   string | null;
  yourName:      string;
  childName:     string;
  onSent():      void;
  initialEmail?: string;
}

function InviteSheet({ open, onClose, householdId, yourName, childName, onSent, initialEmail }: InviteSheetProps) {
  const [email,   setEmail]   = useState(initialEmail ?? "");
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  useEffect(() => {
    if (open) { setEmail(initialEmail ?? ""); setNote(""); setError(""); setSent(false); }
  }, [open, initialEmail]);

  async function send() {
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      if (householdId) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token ?? "";
        await fetch("/api/invites/send", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email:        email.trim().toLowerCase(),
            household_id: householdId,
            inviter_name: yourName,
            child_name:   childName,
            note:         note.trim() || null,
          }),
        });
      }
      setSent(true);
      onSent();
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
          {/* Backdrop */}
          <motion.div
            key="invite-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
            onClick={sent ? onClose : undefined}
          />

          {/* Sheet */}
          <motion.div
            key="invite-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[90] max-w-md mx-auto rounded-t-[2rem] px-6 pt-5 pb-12 overflow-hidden"
            style={{ background: "var(--surface-card)" }}
          >
            {/* Handle */}
            <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border-medium)" }} />

            <AnimatePresence mode="wait">

              {/* ── Success state ── */}
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="text-center pb-2"
                >
                  {/* Check circle */}
                  <div
                    className="w-[68px] h-[68px] rounded-full mx-auto flex items-center justify-center mb-5"
                    style={{ background: "var(--sage-light)" }}
                  >
                    <Check size={30} strokeWidth={2.2} style={{ color: "var(--sage)" }} />
                  </div>

                  <p className="text-[22px] font-extrabold text-foreground tracking-tight mb-2">
                    Invite sent 🌱
                  </p>
                  <p className="text-[13.5px] text-muted-foreground/55 leading-relaxed">
                    <span className="font-semibold text-foreground/60">{email}</span>
                    <br />will get a warm welcome to join
                    <br />{childName}&apos;s circle.
                  </p>

                  <button
                    onClick={onClose}
                    className="mt-8 w-full h-12 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
                    style={{ background: "var(--surface-raised)", color: "var(--text-secondary)" }}
                  >
                    Done
                  </button>
                </motion.div>

              ) : (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Invite preview card */}
                  <div
                    className="rounded-2xl px-5 py-4 mb-5 relative overflow-hidden"
                    style={{
                      background: "linear-gradient(145deg, #EFE0C0 0%, #FAF4E8 100%)",
                      border:     "1px solid rgba(180,130,50,0.12)",
                    }}
                  >
                    {/* Decorative large emoji — top right */}
                    <span
                      className="absolute -top-1 -right-1 text-[52px] opacity-[0.12] rotate-12 select-none pointer-events-none"
                      aria-hidden
                    >
                      🌱
                    </span>

                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700/50 mb-3">
                      They&apos;ll receive
                    </p>

                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-[20px] leading-none select-none">🌱</span>
                      <p className="text-[16px] font-bold text-foreground leading-tight">
                        Join {childName}&apos;s care circle
                      </p>
                    </div>

                    <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {yourName} is inviting you into something very special —
                      the circle of people who show up for {childName} every day.
                    </p>
                  </div>

                  {/* Close button row */}
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-[17px] font-bold text-foreground">Who are you inviting?</p>
                    <button
                      onClick={onClose}
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(0,0,0,0.06)" }}
                    >
                      <X size={12} strokeWidth={2.2} className="text-foreground/40" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground/45 uppercase tracking-wider mb-2 block">
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="their@email.com"
                        className="w-full rounded-xl px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 outline-none"
                        style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
                        onKeyDown={e => e.key === "Enter" && send()}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground/45 uppercase tracking-wider mb-2 block">
                        Personal message
                        <span className="font-normal normal-case ml-1 opacity-60">— adds a warm touch</span>
                      </label>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder={`Can't wait for you to be part of ${childName}'s world…`}
                        rows={2}
                        className="w-full rounded-xl px-4 py-3.5 text-[14px] text-foreground placeholder:text-muted-foreground/30 outline-none resize-none leading-relaxed"
                        style={{ background: "var(--surface-raised)", border: "1px solid var(--border-soft)" }}
                      />
                    </div>
                  </div>

                  {error && <p className="text-[12px] text-red-500/80 mt-3">{error}</p>}

                  <button
                    onClick={send}
                    disabled={!email.trim() || loading}
                    className="mt-5 w-full h-[52px] rounded-2xl flex items-center justify-center gap-2.5 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
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
              )}

            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
      const res  = await fetch("/api/care-circle", {
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
    setData(prev => ({ ...prev, members: prev.members.filter(m => m.user_id !== userId) }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/care-circle/remove-member", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ user_id: userId }),
      });
    } catch { load(); }
  }

  async function cancelInvite(inviteId: string) {
    setData(prev => ({ ...prev, invites: prev.invites.filter(i => i.id !== inviteId) }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch("/api/care-circle/cancel-invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ invite_id: inviteId }),
      });
    } catch { load(); }
  }

  function openResend(email: string) {
    setResendEmail(email);
    setInviteOpen(true);
  }

  const parents    = data.members.filter(m => m.role === "parent");
  const nannies    = data.members.filter(m => m.role === "nanny");
  const hasInvites = data.invites.length > 0;
  const totalCount = data.members.length;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--surface-page)" }}>

      {/* ── Sticky header ── */}
      <div
        className="sticky top-0 z-20 px-4 pt-12 pb-4 flex items-center gap-3"
        style={{
          background:           "var(--surface-header)",
          backdropFilter:       "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom:         "1px solid var(--border-soft)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform shrink-0"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          <ArrowLeft size={15} strokeWidth={2} className="text-foreground/60" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-foreground leading-tight">Care circle</h1>
          {!data.demo && data.household_name && (
            <p className="text-[11.5px] text-muted-foreground/45 mt-0.5">{data.household_name}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-24">
          <span className="w-5 h-5 border-2 border-border border-t-muted-foreground/60 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="px-4 pt-5 space-y-7"
        >

          {/* ── Hero ── */}
          <div
            className="rounded-[1.5rem] px-5 py-5 overflow-hidden relative"
            style={{
              background: "linear-gradient(145deg, #F5E8D4 0%, var(--surface-card) 70%)",
              border:     "1px solid var(--border-soft)",
              boxShadow:  "var(--shadow-card)",
            }}
          >
            {/* Decorative heart — top right */}
            <Heart
              size={72}
              strokeWidth={0.7}
              className="absolute -top-3 -right-3 opacity-[0.06] rotate-12"
              style={{ color: "var(--accent-primary)" }}
            />

            <div className="flex items-center justify-between mb-4">
              <AvatarStack members={data.members} />
              <span className="text-[12px] font-semibold text-muted-foreground/40">
                {totalCount} {totalCount === 1 ? "person" : "people"}
              </span>
            </div>

            <p className="text-[22px] font-extrabold text-foreground tracking-tight leading-tight">
              {data.child_name}&apos;s circle
            </p>
            <p className="text-[13px] text-muted-foreground/50 mt-1 leading-snug">
              Everyone here, every day, for him
            </p>
          </div>

          {/* ── Parents ── */}
          {parents.length > 0 && (
            <section>
              <SectionLabel>Parents</SectionLabel>
              <div className="space-y-2.5">
                {parents.map((m, i) => (
                  <motion.div
                    key={m.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
                  >
                    <MemberCard
                      member={m}
                      isParent={data.is_parent}
                      onRemove={removeMember}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Caregivers ── */}
          {nannies.length > 0 && (
            <section>
              <SectionLabel>Caregivers</SectionLabel>
              <div className="space-y-2.5">
                {nannies.map((m, i) => (
                  <motion.div
                    key={m.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
                  >
                    <MemberCard
                      member={m}
                      isParent={data.is_parent}
                      isPrimary={nannies.length === 1}
                      onRemove={removeMember}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── Waiting to join ── */}
          <AnimatePresence>
            {hasInvites && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <SectionLabel>Waiting to join</SectionLabel>
                <div className="space-y-2.5">
                  {data.invites.map((inv, i) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                    >
                      <InviteCard
                        invite={inv}
                        isParent={data.is_parent}
                        onCancel={cancelInvite}
                        onResend={openResend}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Empty caregivers state ── */}
          {nannies.length === 0 && !hasInvites && (
            <div
              className="rounded-[1.25rem] px-5 py-7 text-center"
              style={{
                background: "var(--surface-card)",
                border:     "1px solid var(--border-soft)",
              }}
            >
              <div
                className="w-12 h-12 rounded-[1rem] mx-auto flex items-center justify-center mb-3"
                style={{ background: "var(--sage-light)" }}
              >
                <Heart size={18} strokeWidth={1.5} style={{ color: "var(--sage)" }} />
              </div>
              <p className="text-[14px] font-semibold text-foreground/70">
                It takes a village
              </p>
              <p className="text-[12.5px] text-muted-foreground/40 mt-1.5 leading-relaxed">
                Invite a caregiver to join<br />{data.child_name}&apos;s circle
              </p>
            </div>
          )}

          {/* ── Add to circle CTA (parents only) ── */}
          {data.is_parent && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              onClick={() => { setResendEmail(null); setInviteOpen(true); }}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all active:scale-[0.98]",
                "border-[1.5px] border-dashed",
              )}
              style={{ borderColor: "var(--border-medium)", background: "transparent" }}
            >
              <div
                className="w-[52px] h-[52px] rounded-[1rem] flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-light)" }}
              >
                <UserPlus size={18} strokeWidth={1.6} style={{ color: "var(--accent-primary)" }} />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-semibold text-foreground/70">
                  Add to {data.child_name}&apos;s circle
                </p>
                <p className="text-[12px] text-muted-foreground/40 mt-0.5">
                  Invite a caregiver, grandparent, or specialist
                </p>
              </div>
            </motion.button>
          )}

        </motion.div>
      )}

      {/* ── Invite sheet ── always mount for parents; householdId null = demo mode */}
      {data.is_parent && (
        <InviteSheet
          open={inviteOpen}
          onClose={() => { setInviteOpen(false); setResendEmail(null); }}
          householdId={data.household_id}
          yourName={data.your_name}
          childName={data.child_name}
          initialEmail={resendEmail ?? undefined}
          onSent={load}
        />
      )}
    </div>
  );
}
