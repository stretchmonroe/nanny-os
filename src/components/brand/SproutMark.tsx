import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function SproutMark({ size = 32, className, priority = false }: Props) {
  return (
    <Image
      src="/sprout-mark.png"
      alt="Sprout by Ankur"
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain select-none", className)}
    />
  );
}
