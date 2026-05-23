"use client";

import { useState } from "react";
import { Camera, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  childId?: string | null;
  onUpload?: () => void;
}

export default function PhotoUploader({ childId, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errored,   setErrored]   = useState(false);
  const currentUserRole = useAppStore((s) => s.currentUserRole);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrored(false);
    try {
      const ext      = file.name.split(".").pop() ?? "jpg";
      const folder   = childId ?? "shared";
      const fileName = `${folder}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("photos")
        .upload(fileName, file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("photos").getPublicUrl(fileName);

      const { error: insertErr } = await supabase.from("memory_events").insert({
        type:       "photo",
        content:    "Photo",
        image_url:  data.publicUrl,
        child_id:   childId ?? "default",
        created_by: currentUserRole ?? "nanny",
      });
      if (insertErr) throw insertErr;

      e.target.value = "";
      onUpload?.();
    } catch (err) {
      console.error("[PhotoUploader]", err);
      setErrored(true);
      setTimeout(() => setErrored(false), 3000);
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      htmlFor="photo-upload"
      className="w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
      title={errored ? "Upload failed — check that the photos storage bucket exists" : "Add photo"}
    >
      {uploading ? (
        <Loader2 size={15} className="animate-spin text-muted-foreground" />
      ) : errored ? (
        <AlertCircle size={15} className="text-red-500" />
      ) : (
        <Camera size={15} className="text-muted-foreground" />
      )}
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={upload}
        disabled={uploading}
      />
    </label>
  );
}
