"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Square, Camera, Play, Pause } from "lucide-react";
import type { JournalMoment } from "@/lib/data/demo";

// ── Recording animation — deterministic bar params ────────────────────────────

const REC_BARS = Array.from({ length: 36 }, (_, i) => ({
  maxH: 15 + (i * 11 + 7) % 68,
  minH: 4  + (i * 5  + 2) % 10,
  dur:  0.32 + ((i * 3) % 7) * 0.05,
  delay: i * 0.035,
}));

// ── Waveform for review preview (same as AudioMoment) ─────────────────────────

function genWave(seed: string, n = 44): number[] {
  let s = seed.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const r = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
  return Array.from({ length: n }, (_, i) => {
    const env = Math.pow(Math.sin((i / (n - 1)) * Math.PI), 0.55);
    return Math.max(0.07, env * (0.22 + r() * 0.65) + 0.04);
  });
}

function fmt(secs: number): string {
  const s = Math.floor(Math.max(0, secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "idle" | "recording" | "review";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (moment: Omit<JournalMoment, "id">) => void;
}

// ── VoiceMemorySheet ──────────────────────────────────────────────────────────

export default function VoiceMemorySheet({ open, onClose, onSave }: Props) {
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [elapsed,      setElapsed]      = useState(0);
  const [transcript,   setTranscript]   = useState("");
  const [caption,      setCaption]      = useState("");
  const [audioUrl,     setAudioUrl]     = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [playing,      setPlaying]      = useState(false);
  const [reviewProg,   setReviewProg]   = useState(0);

  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<Blob[]>([]);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef      = useRef<any>(null);
  const audioElRef    = useRef<HTMLAudioElement | null>(null);
  const reviewTimRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const reviewId = "review-preview";
  const reviewBars = genWave(reviewId, 44);

  // Clean up on close
  useEffect(() => {
    if (!open) {
      stopAll();
      setPhase("idle");
      setElapsed(0);
      setTranscript("");
      setCaption("");
      setAudioUrl(null);
      setPhotoPreview(null);
      setPlaying(false);
      setReviewProg(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function stopAll() {
    if (timerRef.current)     clearInterval(timerRef.current);
    if (reviewTimRef.current) clearInterval(reviewTimRef.current);
    if (mediaRecRef.current?.state === "recording") mediaRecRef.current.stop();
    if (recogRef.current) try { recogRef.current.stop(); } catch {}
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
  }

  // ── Start recording ─────────────────────────────────────────────────────────

  async function startRecording() {
    setPhase("recording");
    setElapsed(0);
    setTranscript("");

    const startMs = Date.now();
    timerRef.current = setInterval(() => setElapsed((Date.now() - startMs) / 1000), 80);

    // Speech recognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setTranscript(Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(" "));
      };
      try { rec.start(); } catch {}
      recogRef.current = rec;
    }

    // MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start(200);
      mediaRecRef.current = mr;
    } catch {
      // Mic permission denied — continue with visual-only recording
    }
  }

  // ── Stop recording ──────────────────────────────────────────────────────────

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recogRef.current) try { recogRef.current.stop(); } catch {}
    if (mediaRecRef.current?.state === "recording") mediaRecRef.current.stop();
    setPhase("review");
    setPlaying(false);
    setReviewProg(0);
  }

  // ── Review playback ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "review") return;
    if (!playing) {
      if (reviewTimRef.current) clearInterval(reviewTimRef.current);
      return;
    }
    const dur = Math.max(1, elapsed);
    const p0  = reviewProg;
    const t0  = Date.now() - p0 * dur * 1000;

    if (audioUrl && !audioElRef.current) {
      const audio = new Audio(audioUrl);
      audioElRef.current = audio;
      audio.ontimeupdate = () => setReviewProg(audio.currentTime / (audio.duration || dur));
      audio.onended = () => { setPlaying(false); setReviewProg(0); };
      audio.play();
    } else if (!audioUrl) {
      reviewTimRef.current = setInterval(() => {
        const p = (Date.now() - t0) / 1000 / dur;
        if (p >= 1) { setReviewProg(0); setPlaying(false); }
        else setReviewProg(p);
      }, 50);
    }
    return () => { if (reviewTimRef.current) clearInterval(reviewTimRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, phase]);

  function togglePlayback() {
    if (audioElRef.current) {
      if (playing) audioElRef.current.pause();
      else { if (reviewProg >= 0.99) audioElRef.current.currentTime = 0; audioElRef.current.play(); }
    }
    setPlaying(v => !v);
  }

  // ── Photo attachment ────────────────────────────────────────────────────────

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function save() {
    onSave({
      type:      "audio",
      content:   caption || transcript,
      duration:  Math.round(elapsed),
      time:      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      category:  "play",
      createdBy: "nanny",
      imageUrl:  photoPreview ?? undefined,
      audioUrl:  audioUrl ?? undefined,
    });
    onClose();
  }

  const reviewPlayheadIdx = Math.floor(reviewProg * reviewBars.length);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(10,8,6,0.55)", backdropFilter: "blur(6px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.9 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden"
            style={{ background: "var(--surface-card)", paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border-medium)" }} />
            </div>

            {/* Close */}
            <div className="flex items-center justify-between px-6 pt-2 pb-4">
              <p className="text-[13px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
                {phase === "idle" ? "Voice Memory" : phase === "recording" ? "Recording…" : "Your Voice Memory"}
              </p>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-raised)" }}
              >
                <X size={13} className="text-muted-foreground/60" strokeWidth={2.5} />
              </motion.button>
            </div>

            <AnimatePresence mode="wait">

              {/* ── IDLE ─────────────────────────────────────────────────────── */}
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  className="px-6 pb-8 flex flex-col items-center text-center gap-5"
                >
                  <div className="space-y-1.5 max-w-[240px] pt-2">
                    <p className="text-[22px] font-extrabold text-foreground tracking-tight leading-snug">
                      Capture this moment
                    </p>
                    <p className="text-[14px] text-muted-foreground/50 leading-relaxed font-medium">
                      A voice memo lives alongside photos and notes — small and precious forever
                    </p>
                  </div>

                  {/* Big mic button */}
                  <motion.button
                    onClick={startRecording}
                    whileTap={{ scale: 0.93 }}
                    className="relative w-20 h-20 rounded-full flex items-center justify-center mt-2"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    {/* Outer glow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--accent-primary)", opacity: 0.25 }}
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
                      <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </motion.button>

                  <p className="text-[12px] font-medium text-muted-foreground/35">
                    Tap to begin recording
                  </p>
                </motion.div>
              )}

              {/* ── RECORDING ────────────────────────────────────────────────── */}
              {phase === "recording" && (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  className="px-6 pb-8"
                >
                  {/* Live waveform */}
                  <div className="flex items-end justify-center gap-[3px] h-[80px] mb-6">
                    {REC_BARS.map((b, i) => (
                      <motion.div
                        key={i}
                        className="rounded-full"
                        style={{ width: 4, background: "var(--accent-primary)" }}
                        animate={{ height: [`${b.minH}%`, `${b.maxH}%`, `${b.minH * 1.5}%`, `${b.maxH * 0.75}%`, `${b.minH}%`] }}
                        transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
                      />
                    ))}
                  </div>

                  {/* Recording indicator + timer */}
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-rose-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    />
                    <span className="text-[22px] font-mono font-bold text-foreground/80 tabular-nums tracking-tight">
                      {fmt(elapsed)}
                    </span>
                  </div>

                  {/* Live transcript preview */}
                  {transcript && (
                    <div className="mb-6 px-4 py-3 rounded-2xl" style={{ background: "var(--surface-raised)" }}>
                      <p className="text-[13px] italic text-muted-foreground/65 leading-relaxed">
                        &ldquo;{transcript}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Stop button */}
                  <div className="flex justify-center">
                    <motion.button
                      onClick={stopRecording}
                      whileTap={{ scale: 0.88 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: "var(--surface-raised)", border: "2px solid var(--border-soft)" }}
                    >
                      <Square size={18} className="text-foreground/70 fill-foreground/70" strokeWidth={0} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── REVIEW ───────────────────────────────────────────────────── */}
              {phase === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  className="px-6 pb-4"
                >
                  {/* Waveform playback preview */}
                  <div
                    className="rounded-2xl px-4 pt-4 pb-4 mb-4"
                    style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
                  >
                    <div className="flex items-end gap-[1.5px] h-[48px] mb-3">
                      {reviewBars.map((h, i) => {
                        const active = reviewProg > 0 && i <= reviewPlayheadIdx;
                        return (
                          <div
                            key={i}
                            className="flex-1 min-w-0 rounded-full transition-colors duration-75"
                            style={{
                              height:     `${h * 100}%`,
                              background: active ? "var(--accent-primary)" : "var(--foreground)",
                              opacity:    active ? 0.8 : 0.18,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <motion.button
                        onClick={togglePlayback}
                        whileTap={{ scale: 0.85 }}
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        {playing
                          ? <Pause size={9} className="text-white fill-white" strokeWidth={0} />
                          : <Play  size={9} className="text-white fill-white translate-x-px" strokeWidth={0} />
                        }
                      </motion.button>
                      <span className="text-[11px] font-medium tabular-nums text-muted-foreground/40">
                        {reviewProg > 0 ? fmt(reviewProg * elapsed) : fmt(elapsed)}
                      </span>
                    </div>
                  </div>

                  {/* Transcript (editable) */}
                  <div
                    className="rounded-2xl px-4 py-3.5 mb-3"
                    style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
                      Transcript
                    </p>
                    <textarea
                      value={transcript}
                      onChange={e => setTranscript(e.target.value)}
                      placeholder="What did you capture? Edit the transcript…"
                      rows={2}
                      className="w-full resize-none text-[13px] text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/30 placeholder:italic"
                    />
                  </div>

                  {/* Photo + Caption row */}
                  <div className="flex items-start gap-3 mb-5">
                    {/* Photo attach */}
                    <div className="shrink-0">
                      {photoPreview ? (
                        <div className="relative w-14 h-14">
                          <div className="w-14 h-14 rounded-xl overflow-hidden">
                            <Image src={photoPreview} alt="" fill className="object-cover" sizes="56px" />
                          </div>
                          <button
                            onClick={() => setPhotoPreview(null)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "var(--foreground)", color: "var(--background)" }}
                          >
                            <X size={9} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed"
                          style={{ borderColor: "var(--border-medium)" }}
                        >
                          <Camera size={16} className="text-muted-foreground/35" />
                          <span className="text-[9px] font-semibold text-muted-foreground/30 uppercase tracking-wide">Photo</span>
                        </button>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhoto}
                      />
                    </div>

                    {/* Caption */}
                    <div className="flex-1">
                      <div
                        className="rounded-2xl px-4 py-3.5 h-14 flex items-center"
                        style={{ background: "var(--surface-raised)", border: "1.5px solid var(--border-soft)" }}
                      >
                        <input
                          value={caption}
                          onChange={e => setCaption(e.target.value)}
                          placeholder="Add a caption…"
                          className="w-full text-[13px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/30 placeholder:italic font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save / Discard */}
                  <div className="flex gap-2.5">
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={onClose}
                      className="flex-1 h-12 rounded-2xl text-[14px] font-semibold"
                      style={{ background: "var(--surface-raised)", color: "var(--text-secondary)" }}
                    >
                      Discard
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={save}
                      className="flex-[2] h-12 rounded-2xl text-[14px] font-semibold text-white"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      Save memory
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
