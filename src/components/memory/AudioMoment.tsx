"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthorBadge from "@/components/ui/AuthorBadge";
import ReactionBar from "@/components/memory/ReactionBar";
import ReplyThread from "@/components/memory/ReplyThread";
import type { JournalMoment, MemoryEvent, MomentReaction, MomentReply } from "@/lib/data/demo";

// ── Waveform ──────────────────────────────────────────────────────────────────

function generateWaveform(id: string, count = 44): number[] {
  let s = id.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const rand = () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const env = Math.pow(Math.sin(t * Math.PI), 0.55);
    return Math.max(0.07, env * (0.22 + rand() * 0.65) + 0.04);
  });
}

function fmt(secs: number): string {
  const s = Math.floor(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── PhotoStamp — scrapbook polaroid pinned to card ────────────────────────────

function PhotoStamp({ imageUrl, id }: { imageUrl: string; id: string }) {
  const n = id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const rot = [-3.5, 2.8, -2.4, 3.9, -1.8][(n + 2) % 5];
  return (
    <div
      className="absolute -top-3 right-5 z-10 w-[68px]"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <div
        className="bg-white rounded-[2px] pt-1.5 px-1.5 pb-5"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)" }}
      >
        <div className="relative w-full overflow-hidden rounded-[1px]" style={{ aspectRatio: "1" }}>
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="68px" />
        </div>
      </div>
    </div>
  );
}

// ── AudioMoment ───────────────────────────────────────────────────────────────

type Moment = JournalMoment | MemoryEvent;

interface Props {
  moment: Moment;
  showInteractions?: boolean;
}

export default function AudioMoment({ moment, showInteractions = true }: Props) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  const duration = moment.duration ?? 20;
  const bars = useMemo(() => generateWaveform(moment.id, 44), [moment.id]);

  // Real audio element when URL is present
  useEffect(() => {
    if (!moment.audioUrl) return;
    const audio = new Audio(moment.audioUrl);
    audioRef.current = audio;
    const onTime  = () => setProgress(audio.currentTime / (audio.duration || duration));
    const onEnded = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [moment.audioUrl, duration]);

  // Simulated playback when no real audio
  useEffect(() => {
    if (moment.audioUrl) return;
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const p0 = progress;
    const t0 = Date.now() - p0 * duration * 1000;
    intervalRef.current = setInterval(() => {
      const p = (Date.now() - t0) / 1000 / duration;
      if (p >= 1) { setProgress(0); setPlaying(false); }
      else setProgress(p);
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration, moment.audioUrl]);

  function toggle() {
    if (moment.audioUrl && audioRef.current) {
      if (playing) audioRef.current.pause();
      else { if (progress >= 0.99) audioRef.current.currentTime = 0; audioRef.current.play(); }
    }
    setPlaying(v => !v);
  }

  const playheadIdx = Math.floor(progress * bars.length);

  // Interactions — JournalMoment has reactions/replies, MemoryEvent does not
  const reactions = "reactions" in moment ? (moment.reactions as MomentReaction[] | undefined) : undefined;
  const replies   = "replies"   in moment ? (moment.replies   as MomentReply[]   | undefined) : undefined;

  return (
    <div className="px-5 py-4">
      <div className={cn("relative", moment.imageUrl && "mt-4")}>
        {moment.imageUrl && (
          <PhotoStamp imageUrl={moment.imageUrl} id={moment.id} />
        )}

        <div
          className="rounded-[1.75rem] overflow-hidden"
          style={{
            background:  "var(--surface-card)",
            border:      "1.5px solid var(--border-soft)",
            boxShadow:   "0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          {/* Waveform + controls */}
          <div className="px-5 pt-6 pb-4">
            {/* Waveform bars */}
            <div className="flex items-end gap-[1.5px] h-[52px] mb-4">
              {bars.map((h, i) => {
                const active   = progress > 0 && i <= playheadIdx;
                const isCursor = playing && i === playheadIdx;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 min-w-0 rounded-full"
                    style={{ height: `${h * 100}%` }}
                    animate={isCursor ? { scaleY: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.28, repeat: isCursor ? Infinity : 0, ease: "easeInOut" }}
                  >
                    <div
                      className="w-full h-full rounded-full transition-colors duration-100"
                      style={{
                        background: active ? "var(--accent-primary)" : "var(--foreground)",
                        opacity:    active ? 0.82 : 0.17,
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Play + duration + author */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.button
                  onClick={toggle}
                  whileTap={{ scale: 0.84 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-primary)" }}
                >
                  {playing
                    ? <Pause size={9} className="text-white fill-white" strokeWidth={0} />
                    : <Play  size={9} className="text-white fill-white translate-x-px" strokeWidth={0} />
                  }
                </motion.button>
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground/40">
                  {progress > 0 ? fmt(progress * duration) : fmt(duration)}
                </span>
              </div>
              {moment.createdBy && (
                <AuthorBadge author={moment.createdBy} time={moment.time} showRole={false} />
              )}
            </div>
          </div>

          {/* Transcription */}
          {moment.content && (
            <div className="px-5 pb-5">
              <div className="border-t pt-3.5" style={{ borderColor: "var(--border-soft)" }}>
                <p className="text-[13px] italic text-muted-foreground/65 leading-relaxed font-medium">
                  &ldquo;{moment.content}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Interactions */}
          {showInteractions && (
            <div className={cn("px-5 pb-5 space-y-3", !moment.content && "pt-0")}>
              <ReactionBar initialReactions={reactions} />
              <ReplyThread initialReplies={replies} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
