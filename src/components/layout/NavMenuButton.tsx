"use client"

import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  className?: string
}

export function NavMenuButton({ className }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.86 }}
      onClick={() => window.dispatchEvent(new Event("open-nav"))}
      aria-label="Open navigation"
      className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors active:bg-black/5 dark:active:bg-white/5",
        className,
      )}
    >
      <Menu size={15} strokeWidth={1.9} className="text-foreground/40" />
    </motion.button>
  )
}
