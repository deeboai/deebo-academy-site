import type { ReactNode } from "react";
import Link from "next/link";

import { ACADEMY_UPDATED_AT } from "@/content/academy-content";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  description,
  children,
}: LegalPageProps) {
  return (
    <>
      <section className="site-section pb-10 pt-20">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <p className="site-kicker">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {ACADEMY_UPDATED_AT}</p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <div className="site-panel mx-auto max-w-4xl px-6 py-8 md:px-10 md:py-10">
            <article className="space-y-5 text-base leading-relaxed text-muted-foreground">
              {children}
            </article>
            <div className="mt-10 flex flex-wrap gap-4 border-t border-border/80 pt-6 text-sm text-muted-foreground">
              <Link href="/book" className="hover:text-primary">
                Back to booking
              </Link>
              <Link href="/client-agreement" className="hover:text-primary">
                Client Agreement
              </Link>
              <Link href="/terms" className="hover:text-primary">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
