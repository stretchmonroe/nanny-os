"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { weeklyMoments } from "@/lib/data/demo";
import type { JournalMoment, JournalMomentType, ActivityCategory } from "@/lib/data/demo";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";
import NoteComposeSheet from "@/components/memory/NoteComposeSheet";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

const today = weeklyMoments[0];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function withinEditWindow(createdAt?: string) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

function normalizeMoment(raw: Record<string, unknown>): JournalMoment {
  const ts = raw.created_at as string | undefined;
  return {
    id:         String(raw.id),
    type:       (["photo", "note", "milestone"].includes(raw.type as string) ? raw.type : "note") as JournalMomentType,
    content:    String(raw.content ?? ""),
    time:       ts ? new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
    createdAt:  ts,
    imageUrl:   raw.image_url as string | undefined,
    category:   (raw.category ?? "play") as ActivityCategory,
    createdBy:  raw.created_by === "parent" ? "parent" : "nanny",
    isFavorite: Boolean(raw.is_favorite),
  };
}

// ── Context menu (three-dot button + dropdown) ────────────────────────────────
function MomentMenu({ onEdit, onDelete, canEdit }: { onEdit: () => void; onDelete: () => void; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        <MoreHorizontal size={14} className="text-white/80" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 bg-surface-card border border-border rounded-2xl shadow-elevated overflow-hidden z-50 min-w-[140px]">
          {canEdit && (
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-semibold text-foreground hover:bg-surface-raised transition-colors"
            >
              <Pencil size={13} className="text-muted-foreground" />
              Edit
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-[13px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/** Heart button — toggles is_favorite in the DB */
function FavoriteButton({ momentId, initialFavorited, variant = "photo" }: {
  momentId: string;
  initialFavorited?: boolean;
  variant?: "photo" | "card";
}) {
  const [liked, setLiked] = useState(initialFavorited ?? false);
  const [popped, setPopped] = useState(false);

  async function tap() {
    const next = !liked;
    setLiked(next);
    if (next) { setPopped(true); setTimeout(() => setPopped(false), 600); }
    await supabase.from("memory_events").update({ is_favorite: next }).eq("id", momentId);
  }

  return (
    <motion.button
      onClick={tap}
      animate={popped ? { scale: [1, 1.5, 0.85, 1.1, 1] } : { scale: 1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className={variant === "photo"
        ? "w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
        : "w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center"
      }
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={liked ? "filled" : "empty"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={variant === "photo" ? "text-[16px] leading-none" : "text-[13px] leading-none"}
        >
          {liked ? "❤️" : "🤍"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

function HeroPhoto({ moment, authorName, actions }: { moment: JournalMoment; authorName?: string; actions?: React.ReactNode }) {
  return (
    <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "3/4" }}>
      {moment.imageUrl && (
        <Image
          src={moment.imageUrl}
          alt={moment.content}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute top-4 right-4 flex items-center gap-2">
        {actions}
        <FavoriteButton momentId={moment.id} initialFavorited={moment.isFavorite} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        <p className="text-[20px] font-bold text-white leading-snug tracking-tight mb-3">
          {moment.content}
        </p>
        {moment.createdBy && (
          <AuthorBadge author={moment.createdBy} name={authorName} time={moment.time} light />
        )}
      </div>
    </div>
  );
}

function InsetPhoto({ moment, authorName, actions }: { moment: JournalMoment; authorName?: string; actions?: React.ReactNode }) {
  return (
    <div className="px-5 py-5">
      <div
        className="relative w-full rounded-[1.5rem] overflow-hidden bg-muted shadow-elevated"
        style={{ aspectRatio: "4/3" }}
      >
        {moment.imageUrl && (
          <Image
            src={moment.imageUrl}
            alt={moment.content}
            fill
            className="object-cover"
            sizes="(max-width: 416px) 100vw, 416px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
          {actions}
          <FavoriteButton momentId={moment.id} initialFavorited={moment.isFavorite} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[16px] font-bold text-white leading-snug tracking-tight mb-2.5">
            {moment.content}
          </p>
          {moment.createdBy && (
            <AuthorBadge author={moment.createdBy} name={authorName} time={moment.time} light />
          )}
        </div>
      </div>
    </div>
  );
}

function MilestonePanel({ moment, authorName, actions }: { moment: JournalMoment; authorName?: string; actions?: React.ReactNode }) {
  return (
    <div className="px-8 py-16 text-center relative">
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <FavoriteButton momentId={moment.id} initialFavorited={moment.isFavorite} variant="card" />
        {actions}
      </div>
      <div className="text-[42px] text-amber-400 dark:text-amber-500 mb-5 leading-none select-none">✦</div>
      <p className="text-[28px] font-extrabold text-foreground leading-snug tracking-tight mb-4 max-w-[260px] mx-auto">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} name={authorName} time={moment.time} className="justify-center mb-6" />
      ) : (
        <p className="text-[11px] font-bold text-muted-foreground/55 uppercase tracking-widest mb-6">
          {moment.time}
        </p>
      )}

      {/* Interactions */}
      <div className="flex flex-col items-center gap-4 max-w-[300px] mx-auto">
        <ReactionBar initialReactions={moment.reactions} className="justify-center" />
        <ReplyThread initialReplies={moment.replies} className="w-full text-left" />
      </div>
    </div>
  );
}

function NoteCard({ moment, authorName, actions }: { moment: JournalMoment; authorName?: string; actions?: React.ReactNode }) {
  return (
    <div className="px-8 py-10 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <FavoriteButton momentId={moment.id} initialFavorited={moment.isFavorite} variant="card" />
        {actions}
      </div>
      <p className="text-[64px] leading-[0.65] text-amber-300 dark:text-amber-700 font-serif mb-4 select-none">&ldquo;</p>
      <p className="text-[20px] font-medium text-foreground leading-[1.7] mb-5">
        {moment.content}
      </p>
      {moment.createdBy ? (
        <AuthorBadge author={moment.createdBy} name={authorName} time={moment.time} className="mb-5" />
      ) : (
        <p className="text-[12px] text-muted-foreground font-semibold mb-5">{moment.time}</p>
      )}

      {/* Interactions */}
      <div className="space-y-4">
        <ReactionBar initialReactions={moment.reactions} />
        <ReplyThread initialReplies={moment.replies} />
      </div>
    </div>
  );
}

export default function TodayJournal({ childId, refreshKey }: { childId?: string | null; refreshKey?: number }) {
  const [realMoments, setRealMoments] = useState<JournalMoment[]>([]);
  const [status,      setStatus]      = useState<"idle" | "loading" | "done">("idle");
  const [editing,     setEditing]     = useState<JournalMoment | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const { profileFullName, currentUserRole } = useAppStore();
  const isParent = currentUserRole === "parent";

  useEffect(() => {
    if (!childId) { setStatus("idle"); return; }

    setStatus("loading");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    supabase
      .from("memory_events")
      .select("*")
      .eq("child_id", childId)
      .in("type", ["note", "photo", "milestone"])
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setRealMoments((data ?? []).map(normalizeMoment));
        setStatus("done");
      });
  }, [childId, refreshKey]);

  // Demo mode
  if (!childId) {
    const firstPhotoId = today.moments.find((m) => m.type === "photo")?.id;
    return (
      <div className="pb-8">
        {today.moments.map((moment, i) => (
          <motion.div
            key={moment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + i * 0.09, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            {moment.type === "photo" && moment.id === firstPhotoId && <HeroPhoto moment={moment} />}
            {moment.type === "photo" && moment.id !== firstPhotoId && <InsetPhoto moment={moment} />}
            {moment.type === "milestone" && <MilestonePanel moment={moment} />}
            {moment.type === "note" && <NoteCard moment={moment} />}
          </motion.div>
        ))}
      </div>
    );
  }

  // Loading
  if (status !== "done") return null;

  // Real — empty
  if (realMoments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-center pt-14 pb-8 px-6">
        <span className="text-4xl">📖</span>
        <p className="text-[15px] font-semibold text-foreground mt-2">No moments yet today</p>
        <p className="text-[13px] text-muted-foreground max-w-[230px] leading-relaxed">
          Use the mic or camera above to log the first moment of the day.
        </p>
      </div>
    );
  }

  async function confirmDelete(id: string) {
    await supabase.from("memory_events").delete().eq("id", id);
    setRealMoments((prev) => prev.filter((m) => m.id !== id));
    setDeleteId(null);
  }

  // Real — has moments
  const firstPhotoId = realMoments.find((m) => m.type === "photo")?.id;
  return (
    <>
      <div className="pb-8">
        {realMoments.map((moment, i) => {
          const authorName = moment.createdBy === currentUserRole
            ? (profileFullName ?? undefined)
            : undefined;
          const actions = isParent ? (
            <MomentMenu
              canEdit={withinEditWindow(moment.createdAt)}
              onEdit={() => setEditing(moment)}
              onDelete={() => setDeleteId(moment.id)}
            />
          ) : undefined;
          return (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + i * 0.09, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            >
              {moment.type === "photo" && moment.id === firstPhotoId && <HeroPhoto moment={moment} authorName={authorName} actions={actions} />}
              {moment.type === "photo" && moment.id !== firstPhotoId && <InsetPhoto moment={moment} authorName={authorName} actions={actions} />}
              {moment.type === "milestone" && <MilestonePanel moment={moment} authorName={authorName} actions={actions} />}
              {moment.type === "note" && <NoteCard moment={moment} authorName={authorName} actions={actions} />}
            </motion.div>
          );
        })}
      </div>

      {/* Edit sheet */}
      <NoteComposeSheet
        open={!!editing}
        childId={childId ?? null}
        momentId={editing?.id}
        initialText={editing?.content}
        initialCategory={editing?.category as never}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          // Refresh by re-fetching
          setStatus("loading");
          const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
          supabase.from("memory_events").select("*").eq("child_id", childId!).in("type", ["note","photo","milestone"]).gte("created_at", startOfDay.toISOString()).order("created_at", { ascending: true })
            .then(({ data }) => { setRealMoments((data ?? []).map(normalizeMoment)); setStatus("done"); });
        }}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              key="del-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              key="del-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[71] max-w-md mx-auto bg-surface-card rounded-t-[2rem] px-5 pt-6 pb-12 shadow-elevated"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />
              <p className="text-[17px] font-bold text-foreground mb-1">Delete this moment?</p>
              <p className="text-[13px] text-muted-foreground mb-6">This can&apos;t be undone.</p>
              <div className="space-y-2.5">
                <button
                  onClick={() => confirmDelete(deleteId)}
                  className="w-full bg-red-500 text-white font-bold text-[15px] py-4 rounded-2xl active:scale-[0.98] transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="w-full bg-surface-raised text-foreground font-semibold text-[15px] py-4 rounded-2xl active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
