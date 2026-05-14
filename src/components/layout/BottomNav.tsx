"use client";

import Link from "next/link";
import { Home, Calendar, ImageIcon, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home",     icon: Home,          label: "Home"     },
  { href: "/schedule", icon: Calendar,      label: "Schedule" },
  { href: "/memory",   icon: ImageIcon,     label: "Moments"  },
  { href: "/lists",    icon: ShoppingCart,  label: "Lists"    },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-white/85 dark:bg-[#1A1714]/90 backdrop-blur-xl border-t border-stone-200/70 dark:border-stone-800/70">
        <div className="flex justify-around px-2 py-2.5">
          {items.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-4"
              >
                <div
                  className={cn(
                    "p-2 rounded-2xl transition-all duration-200",
                    active
                      ? "bg-zinc-900 dark:bg-stone-100"
                      : "bg-transparent"
                  )}
                >
                  <Icon
                    size={19}
                    className={cn(
                      active ? "text-white dark:text-zinc-900" : "text-stone-400 dark:text-stone-500"
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide",
                    active
                      ? "text-zinc-900 dark:text-stone-100"
                      : "text-stone-400 dark:text-stone-500"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
