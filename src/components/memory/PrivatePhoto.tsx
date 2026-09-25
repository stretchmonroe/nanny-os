"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { photoPath } from "@/lib/supabase/photo-path";

export default function PrivatePhoto(props: Omit<ImageProps, "src"> & { src: string }) {
  const { src, alt, ...rest } = props;
  const path = photoPath(src, process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const [resolved, setResolved] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    let generation = 0;
    async function refresh() {
      const attempt = ++generation;
      if (!path) return;
      try {
        const { data, error } = await supabase.storage.from("photos").createSignedUrl(path, 300);
        if (!cancelled && attempt === generation) setResolved(
          !error && data?.signedUrl ? { source: src, url: data.signedUrl } : null
        );
      } catch {
        if (!cancelled && attempt === generation) setResolved(null);
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 240_000);
    const { data: auth } = supabase.auth.onAuthStateChange(() => {
      ++generation;
      setResolved(null);
      // Defer Supabase calls outside its auth event callback.
      queueMicrotask(() => { if (!cancelled) void refresh(); });
    });
    return () => { cancelled = true; clearInterval(timer); auth.subscription.unsubscribe(); };
  }, [src, path]);
  // Preserve the existing explicitly seeded, public demo illustrations.
  if (/^https:\/\/picsum\.photos\/seed\/[a-zA-Z0-9_-]+\/\d+\/\d+$/.test(src)) return <Image {...rest} src={src} alt={alt} />;
  if (!path || resolved?.source !== src) return <span role="img" aria-label={alt || "Photo unavailable"} className="text-xs text-muted-foreground">Photo unavailable</span>;
  // Do not let Next's shared optimizer cache a private signed response.
  return <Image {...rest} src={resolved.url} alt={alt} unoptimized />;
}
