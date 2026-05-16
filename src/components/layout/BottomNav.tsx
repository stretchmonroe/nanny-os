"use client";

import Link from "next/link";
import { Home, CalendarDays, BookImage, ShoppingBasket, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import VoiceRecorder from "@/components/voice/VoiceRecorder";
import { supabase } from "@/lib/supabase/client";
import type { VoiceResult } from "@/lib/voice/transcriptParser";

const items = [
  { href: "/home",     icon: Home,           label: "Home"     },
  { href: "/schedule", icon: CalendarDays,   label: "Schedule" },
  { href: "/memory",   icon: BookImage,      label: "Journal"  },
  { href: "/lists",    icon: ShoppingBasket, label: "Lists"    },
  { href: "/together", icon: Users,          label: "Together" },
];

async function saveVoiceCapture(result: VoiceResult) {
  const content = result.type === "grocery" ? result.items.join(", ") : result.content;
  try {
    await supabase.from("memory_events").insert({
      type:       "note",
      content,
      child_id:   "default",
      created_by: "parent",
      created_at: new Date().toISOString(),
    });
  } catch {
    // silent fail — voice capture is best-effort
  }
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto relative">

        {/* Ambient voice FAB — floats 28px above the glass bar, centered */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[28px] z-[51]">
          <VoiceRecorder
            context="memory"
            onSave={saveVoiceCapture}
            variant="fab"
          />
        </div>

        {/* Glass bar — no overflow-hidden so FAB shadow isn't clipped */}
        <div
          className="mx-3 mb-3 rounded-[1.6rem] shadow-float"
          style={{ background: "var(--surface-header)" }}
        >
          <div
            className="absolute inset-0 rounded-[1.6rem]"
            style={{
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
            }}
          />
          {/* Two nav items on each side, center gap for the FAB */}
          <div className="relative border-soft rounded-[1.6rem] flex items-center px-2 py-2">
            {items.slice(0, 2).map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-[3px] px-3 py-1 select-none flex-1"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-8 rounded-2xl transition-all duration-200",
                      active ? "bg-foreground shadow-card" : "bg-transparent active:bg-border/40"
                    )}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.3 : 1.7}
                      className={cn(
                        "transition-colors duration-200",
                        active ? "text-background" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wide transition-colors duration-200",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* Spacer that visually reserves room under the FAB */}
            <div className="w-16 shrink-0" />

            {items.slice(2).map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-[3px] px-3 py-1 select-none flex-1"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-8 rounded-2xl transition-all duration-200",
                      active ? "bg-foreground shadow-card" : "bg-transparent active:bg-border/40"
                    )}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.3 : 1.7}
                      className={cn(
                        "transition-colors duration-200",
                        active ? "text-background" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wide transition-colors duration-200",
                      active ? "text-foreground" : "text-muted-foreground"
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
