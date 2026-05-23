"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  childId?: string | null;
  onUpload?: () => void;
}

export default function PhotoUploader({ childId, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUserRole = useAppStore((s) => s.currentUserRole);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);
    try {
      const ext      = file.name.split(".").pop() ?? "jpg";
      const folder   = childId ?? "shared";
      const fileName = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(fileName, file, { upsert: false });
      if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`);

      const { data } = supabase.storage.from("photos").getPublicUrl(fileName);

      const { error: insertErr } = await supabase.from("memory_events").insert({
        type:       "photo",
        content:    "Photo",
        image_url:  data.publicUrl,
        child_id:   childId ?? "default",
        created_by: currentUserRole ?? "nanny",
      });
      if (insertErr) throw new Error(`DB: ${insertErr.message}`);

      if (inputRef.current) inputRef.current.value = "";
      onUpload?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      console.error("[PhotoUploader]", msg);
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
      >
        {uploading
          ? <Loader2 size={15} className="animate-spin text-muted-foreground" />
          : <Camera size={15} className="text-muted-foreground" />
        }
      </button>

      {/* Error toast */}
      {errorMsg && (
        <div className="absolute right-0 top-11 w-64 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] font-medium rounded-xl px-3 py-2 shadow-lg z-50 leading-snug">
          {errorMsg}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={upload}
      />
    </div>
  );
}
