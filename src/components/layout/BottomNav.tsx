"use client";

import Link from "next/link";
import { Home, CalendarDays, BookImage, ShoppingBasket } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home",     icon: Home,           label: "Home"     },
  { href: "/schedule", icon: CalendarDays,   label: "Schedule" },
  { href: "/memory",   icon: BookImage,      label: "Journal"  },
  { href: "/lists",    icon: ShoppingBasket, label: "Lists"    },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto">
        {/* Glass bar */}
        <div
          className="mx-3 mb-3 rounded-[1.6rem] overflow-hidden shadow-float"
          style={{ background: "var(--surface-header)" }}
        >
          <div
            className="absolute inset-0 rounded-[1.6rem]"
            style={{
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            }}
          />
          <div
            className="relative border-soft rounded-[1.6rem] flex justify-around px-2 py-2"
          >
            {items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-[3px] px-3 py-1 select-none"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-8 rounded-2xl transition-all duration-200",
                      active
                        ? "bg-foreground shadow-card"
                        : "bg-transparent active:bg-border/40"
                    )}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.3 : 1.7}
                      className={cn(
                        "transition-colors duration-200",
                        active
                          ? "text-background"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wide transition-colors duration-200",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground"
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
    </div>
  );
}
