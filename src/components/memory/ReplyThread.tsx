"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthorBadge from "@/components/ui/AuthorBadge";
import type { MomentReply } from "@/lib/data/demo";

interface Props {
  initialReplies?: MomentReply[];
  className?: string;
}

export default function ReplyThread({ initialReplies = [], className }: Props) {
  const [replies, setReplies] = useState<MomentReply[]>(initialReplies);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleReplies = expanded ? replies : replies.slice(-2);
  const hiddenCount = replies.length - visibleReplies.length;

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newReply: MomentReply = {
      id: `local_${Date.now()}`,
      author: "nanny",
      content: trimmed,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    };
    setReplies((prev) => [...prev, newReply]);
    setText("");
    setExpanded(true);
  }

  return (
    <div className={cn("space-y-0", className)}>
      {/* Earlier replies toggle */}
      {hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[11px] font-semibold text-muted-foreground/60 mb-2 active:opacity-70"
        >
          {hiddenCount} earlier {hiddenCount === 1 ? "reply" : "replies"}
        </button>
      )}

      {/* Reply list */}
      {visibleReplies.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {visibleReplies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <AuthorBadge author={reply.author} variant="dot" className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground/80 leading-snug">{reply.content}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-medium">{reply.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      <div className="flex items-center gap-2 pt-1">
        <AuthorBadge author="nanny" variant="dot" className="shrink-0" />
        <div className="flex-1 flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a note..."
            className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
          />
          {text.trim() && (
            <button onClick={submit} className="shrink-0 active:opacity-70">
              <Send size={12} className="text-amber-500" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
