"use client";

import type { ReactNode } from "react";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";

type RevealProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "left" | "right";
  delayMs?: number;
  initiallyVisible?: boolean;
};

export function Reveal({
  children,
  className,
  variant = "default",
  delayMs = 0,
  initiallyVisible = false,
}: RevealProps) {
  const revealRef = useScrollReveal<HTMLDivElement>({
    initialClassName: initiallyVisible ? null : "reveal-element",
  });

  return (
    <div
      ref={revealRef}
      className={[!initiallyVisible ? "reveal-element" : "", className]
        .filter(Boolean)
        .join(" ")}
      data-variant={variant === "default" ? undefined : variant}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
