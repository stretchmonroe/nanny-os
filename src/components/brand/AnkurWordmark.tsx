import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  /**
   * Width in pixels — height scales proportionally (wordmark is ~2.7:1 ratio).
   * Defaults to 200.
   */
  width?: number;
  className?: string;
  /** Render priority (above-fold splash use) */
  priority?: boolean;
}

export default function AnkurWordmark({ width = 200, className, priority = false }: Props) {
  const height = Math.round(width / 2.7);
  return (
    <Image
      src="/ankur-wordmark.png"
      alt="Ankur · rooted in care, growing together"
      width={width}
      height={height}
      priority={priority}
      className={cn("object-contain select-none", className)}
    />
  );
}
