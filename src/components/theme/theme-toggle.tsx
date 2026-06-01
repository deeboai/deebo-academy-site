"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type AcademyTheme = "light" | "dark";

function applyTheme(theme: AcademyTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("deebo-academy-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<AcademyTheme>("dark");

  useEffect(() => {
    const initialTheme =
      document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(initialTheme);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/75 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
