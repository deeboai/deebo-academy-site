import Link from "next/link";

import { ACADEMY_SITE_LINKS, ACADEMY_SUPPORT_EMAIL } from "@/content/academy-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-background/95">
      <div className="container py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-lg font-semibold tracking-tight text-foreground">Deebo Academy</p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              One-on-one tutoring in math, biology, chemistry, physics, French, and select
              college-level coursework with clear follow-up.
            </p>
            <a
              href={`mailto:${ACADEMY_SUPPORT_EMAIL}`}
              className="inline-block text-sm text-muted-foreground hover:text-primary"
            >
              {ACADEMY_SUPPORT_EMAIL}
            </a>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {ACADEMY_SITE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            ))}
            <Link href="/client-agreement" className="hover:text-primary">
              Client Agreement
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
