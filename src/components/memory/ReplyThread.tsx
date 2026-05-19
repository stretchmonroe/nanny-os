"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { addReply } from "@/lib/supabase/replies";
import AuthorBadge from "@/components/ui/AuthorBadge";
import type { MomentReply } from "@/lib/data/demo";

const authorNames: Record<"nanny" | "parent", string> = { nanny: "Elena", parent: "Sofia" };

interface Props {
  initialReplies?: MomentReply[];
  momentId?: string;
  className?: string;
}

export default function ReplyThread({ initialReplies = [], momentId, className }: Props) {
  const [replies, setReplies] = useState<MomentReply[]>(initialReplies);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = expanded ? replies : replies.slice(-2);
  const hiddenCount = replies.length - visible.length;

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const tempId = `local_${Date.now()}`;
    const optimistic: MomentReply = {
      id:     tempId,
      author: "nanny" as const,
      content: trimmed,
      time:   new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setReplies((prev) => [...prev, optimistic]);
    setNewId(tempId);
    setTimeout(() => setNewId(null), 1000);
    setText("");
    setExpanded(true);
    setOpen(false);
    if (momentId) {
      const saved = await addReply(momentId, trimmed, "nanny");
      setReplies((prev) => prev.map(r => r.id === tempId ? { ...r, id: saved.id } : r));
    }
  }

  return (
    <div className={cn("", className)}>

      {/* Earlier notes toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="block text-[11px] font-semibold text-muted-foreground/45 mb-3 active:opacity-60 transition-opacity"
        >
          ↑ {hiddenCount} earlier {hiddenCount === 1 ? "note" : "notes"}
        </button>
      )}

      {/* Reply list */}
      <AnimatePresence initial={false}>
        {visible.map((reply) => (
          <motion.div
            key={reply.id}
            initial={reply.id === newId ? { opacity: 0, y: 10, scale: 0.95 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.38, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-start gap-2.5 mb-3"
          >
            <AuthorBadge author={reply.author} variant="dot" className="mt-[3px] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-[11px] font-semibold text-foreground/65">
                  {authorNames[reply.author]}
                </span>
                <span className="text-[10px] text-muted-foreground/35 font-medium">
                  {reply.time}
                </span>
              </div>
              <p className="text-[13px] text-foreground/72 leading-snug">{reply.content}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reply prompt / inline composer */}
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 mt-0.5 group"
          >
            <AuthorBadge author="nanny" variant="dot" />
            <span className="text-[12px] text-muted-foreground/40 font-medium group-hover:text-muted-foreground/60 transition-colors">
              {replies.length > 0 ? "Reply…" : "Leave a note…"}
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="composer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-2 mt-0.5"
          >
            <AuthorBadge author="nanny" variant="dot" className="shrink-0" />
            <div className="flex-1 flex items-center gap-2 bg-white/75 dark:bg-white/7 border border-border/35 rounded-2xl px-3.5 py-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  if (e.key === "Escape") { setText(""); setOpen(false); }
                }}
                onBlur={() => { if (!text.trim()) setOpen(false); }}
                placeholder="Write something warm…"
                className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/35 outline-none min-w-0"
              />
              <AnimatePresence>
                {text.trim() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                    onClick={submit}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    <Send size={10} className="text-white" strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
