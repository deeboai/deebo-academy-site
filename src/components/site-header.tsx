"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ACADEMY_SITE_LINKS } from "@/content/academy-content";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl">
      <div className="container py-4">
        {/* A stacked mobile header keeps navigation centered and available instead of hiding it below desktop widths. */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="animate-fade-in-up">
              <span className="block text-lg font-semibold tracking-tight sm:text-xl">
                <span className="text-foreground">Deebo </span>
                <span className="text-primary">Academy</span>
              </span>
            </Link>

            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <a
                href="https://deeboai.com"
                className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
              >
                Back to DeeboAI
              </a>
              <Link href="/book" className="primary-button px-4 sm:px-6">
                Start Intake
              </Link>
            </div>
          </div>

          <nav
            aria-label="Academy sections"
            className="hide-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1"
          >
            {ACADEMY_SITE_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isActive
                      ? "rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                      : "rounded-full border border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
