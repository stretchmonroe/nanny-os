"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Camera, Loader2 } from "lucide-react";

export default function PhotoUploader() {
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("photos").upload(fileName, file);
      if (error) throw error;

      const { data } = supabase.storage.from("photos").getPublicUrl(fileName);
      await supabase.from("memory_events").insert({
        type: "photo",
        content: "Photo",
        image_url: data.publicUrl,
        child_id: "default",
        created_by: "nanny",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      htmlFor="photo-upload"
      className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-stone-100 text-white dark:text-zinc-900 font-semibold text-sm px-4 py-2.5 rounded-full shadow-lg cursor-pointer active:scale-95 transition-all duration-150"
    >
      {uploading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Camera size={15} />
      )}
      {uploading ? "Uploading…" : "Add Photo"}
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={upload}
        disabled={uploading}
      />
    </label>
  );
}
