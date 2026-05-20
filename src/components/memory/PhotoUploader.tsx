"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";
import { Camera, Loader2, X } from "lucide-react";
import type { JournalMoment } from "@/lib/data/demo";

interface Props {
  onSaved?: (moment: JournalMoment) => void;
}

export default function PhotoUploader({ onSaved }: Props) {
  const [preview,    setPreview]    = useState<string | null>(null);
  const [file,       setFile]       = useState<File | null>(null);
  const [caption,    setCaption]    = useState("");
  const [uploading,  setUploading]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
    if (inputRef.current) inputRef.current.value = "";
  }

  function dismiss() {
    setPreview(null);
    setFile(null);
    setCaption("");
  }

  async function post() {
    if (!file) return;
    setUploading(true);
    const { activeChildId, currentUserRole } = useAppStore.getState();
    const createdBy = (currentUserRole ?? "nanny") as "nanny" | "parent";
    try {
      const fileName = `${activeChildId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("photos").upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
      const content = caption.trim() || "Photo";
      const { data: insertData } = await supabase.from("memory_events").insert({
        type:       "photo",
        content,
        image_url:  data.publicUrl,
        child_id:   activeChildId,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      }).select().single();
      if (onSaved && insertData) {
        const row = insertData as Record<string, unknown>;
        onSaved({
          id:        String(row.id),
          type:      "photo",
          content,
          category:  "play",
          imageUrl:  data.publicUrl,
          createdBy,
          time:      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        });
      }
      dismiss();
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <label
        htmlFor="photo-upload"
        className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-stone-100 text-white dark:text-zinc-900 font-semibold text-sm px-4 py-2.5 rounded-full shadow-lg cursor-pointer active:scale-95 transition-all duration-150"
      >
        <Camera size={15} />
        Add Photo
        <input
          id="photo-upload"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* Preview sheet */}
      <AnimatePresence>
        {preview && (
          <>
            <motion.div
              key="photo-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              onClick={dismiss}
            />

            <motion.div
              key="photo-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            >
              <div
                className="rounded-t-[2rem] px-5 pt-3 pb-28"
                style={{ background: "var(--surface-card)" }}
              >
                <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/10 mx-auto mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    Add to Journal
                  </span>
                  <button
                    onClick={dismiss}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Photo preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-52 object-cover rounded-2xl mb-4"
                />

                {/* Caption */}
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption… (optional)"
                  rows={3}
                  className="w-full resize-none text-[15px] text-foreground leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/35 placeholder:italic font-medium mb-5"
                />

                <motion.button
                  onClick={post}
                  disabled={uploading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-soft))",
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  ) : (
                    "Post to Journal"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
