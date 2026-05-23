"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ankur-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "none", border: "none", cursor: "pointer", padding: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--muted-foreground)", borderRadius: 8,
        opacity: 0.6,
      }}
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  );
}
