"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

type Note = {
  id: string;
  content: string;
  created_by: string | null;
  created_at: string;
};

const DEMO_NOTES: Note[] = [
  {
    id: "d1",
    content: "He went down for nap at 12:48 — earlier than usual but very tired from this morning's park. Should wake by 2:15.",
    created_by: "caregiver",
    created_at: new Date(Date.now() - 3_600_000 * 2).toISOString(),
  },
  {
    id: "d2",
    content: "Pediatric appt tomorrow at 10am — no morning park run. He can eat breakfast first, then we'll head straight over.",
    created_by: "parent",
    created_at: new Date(Date.now() - 3_600_000 * 5).toISOString(),
  },
  {
    id: "d3",
    content: "Tried the pouring station today — he stayed for 25 minutes straight. Definitely worth repeating this week.",
    created_by: "caregiver",
    created_at: new Date(Date.now() - 3_600_000 * 24).toISOString(),
  },
  {
    id: "d4",
    content: "Grandma is visiting Friday afternoon and will pick him up around 3pm. I'll be home by 5:30.",
    created_by: "parent",
    created_at: new Date(Date.now() - 3_600_000 * 28).toISOString(),
  },
];

const ROLE_CONFIG: Record<string, { label: string; emoji: string }> = {
  parent:      { label: "Parent",      emoji: "🏡" },
  nanny:       { label: "Caregiver",   emoji: "🌱" },
  caregiver:   { label: "Caregiver",   emoji: "🤲" },
  grandparent: { label: "Grandparent", emoji: "👴" },
};

function relTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export default function TogetherPage() {
  const { activeChild, currentUserRole } = useAppStore();
  const [notes, setNotes]     = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft]     = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const textareaRef           = useRef<HTMLTextAreaElement>(null);

  const childId   = activeChild?.id ?? null;
  const childName = activeChild?.name ?? "Mateo";
  const isDemo    = !activeChild;

  useEffect(() => {
    if (isDemo) { setNotes(DEMO_NOTES); setLoading(false); return; }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  async function load() {
    if (!childId) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const res = await fetch(`/api/together/notes?childId=${childId}`, {
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const { notes: data } = await res.json();
      setNotes(data ?? []);
    }
    setLoading(false);
  }

  async function sendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !childId) return;
    setSendErr("");
    setSending(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSending(false); return; }

    const res = await fetch("/api/together/notes", {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ content: draft.trim(), childId }),
    });

    if (res.ok) {
      setDraft("");
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      setSendErr(body.error ?? "Something went wrong");
    }
    setSending(false);
  }

  const myConfig = ROLE_CONFIG[currentUserRole ?? "parent"] ?? ROLE_CONFIG.parent;

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Header */}
      <div
        className="px-5 pt-7 pb-5 border-b border-soft"
        style={{ background: "var(--surface-header)" }}
      >
        <h1 className="text-[26px] font-extrabold text-foreground tracking-tight">
          Together
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1 font-medium">
          Coordination notes for {childName}
        </p>
      </div>

      <div className="px-4 pt-5 pb-24 space-y-6">

        {/* Composer — real users only */}
        {!isDemo && (
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Leave a note
            </p>
            <form
              onSubmit={sendNote}
              className="bg-surface-card border-soft rounded-2xl px-4 py-4 shadow-card space-y-3"
            >
              <p className="text-[12px] font-semibold text-muted-foreground">
                Posting as {myConfig.emoji} {myConfig.label}
              </p>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What does the next person need to know?"
                rows={3}
                maxLength={500}
                className="w-full bg-muted rounded-xl px-4 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 outline-none border-soft focus:ring-1 focus:ring-foreground/20 resize-none"
              />
              {sendErr && (
                <p className="text-[13px] font-semibold text-red-500">{sendErr}</p>
              )}
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="w-full bg-foreground text-white font-bold text-[14px] py-3 rounded-xl disabled:opacity-40 transition-opacity"
              >
                {sending ? "Saving…" : "Post note"}
              </button>
            </form>
          </section>
        )}

        {/* Notes feed */}
        <section>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {isDemo ? "Example notes" : "Recent notes"}
          </p>

          {loading && (
            <p className="text-[13px] text-muted-foreground pt-2">Loading…</p>
          )}

          {!loading && !isDemo && notes.length === 0 && (
            <div className="bg-surface-card border-soft rounded-2xl px-4 py-8 shadow-card text-center">
              <p className="text-[28px] mb-2">💬</p>
              <p className="text-[14px] font-semibold text-foreground">No notes yet</p>
              <p className="text-[13px] text-muted-foreground mt-1 max-w-[220px] mx-auto leading-relaxed">
                Leave the first note for your care team above.
              </p>
            </div>
          )}

          {!loading && notes.length > 0 && (
            <div className="space-y-3">
              {notes.map((note) => {
                const cfg = ROLE_CONFIG[note.created_by ?? ""] ?? {
                  label: note.created_by ?? "Someone",
                  emoji: "👤",
                };
                const isMe = !isDemo && note.created_by === currentUserRole;

                return (
                  <div
                    key={note.id}
                    className="bg-surface-card border-soft rounded-2xl px-4 py-4 shadow-card"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center text-[14px] shrink-0">
                        {cfg.emoji}
                      </div>
                      <p className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
                        {cfg.label}
                        {isMe && (
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="ml-auto text-[11px] text-muted-foreground/55 font-medium shrink-0">
                        {relTime(note.created_at)}
                      </p>
                    </div>
                    <p className="text-[14px] text-foreground leading-relaxed pl-9">
                      {note.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {isDemo && (
          <p className="text-center text-[12px] text-muted-foreground/50 pt-1">
            Set up your home to start leaving real notes for your care team.
          </p>
        )}
      </div>
    </div>
  );
}
