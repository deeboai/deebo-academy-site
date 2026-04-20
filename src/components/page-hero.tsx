import type { ReactNode } from "react";

import { Reveal } from "@/components/reveal";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions }: PageHeroProps) {
  return (
    <section className="site-section pb-14 pt-20">
      <div className="container">
        {/* The hero keeps a centered layout but uses the main-site motion and glow treatment on load. */}
        <Reveal
          initiallyVisible
          className="site-panel relative mx-auto max-w-5xl overflow-hidden px-6 py-10 text-center md:px-10 md:py-14"
        >
          <div className="animated-aurora absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative">
            {/* Inner Academy pages read more cleanly when the title leads without a small label above it. */}
            {eyebrow ? (
              <p
                className="site-kicker animate-fade-in-up"
                style={{ animationDelay: "40ms", animationFillMode: "both" }}
              >
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={`mx-auto max-w-4xl animate-fade-in-up text-4xl font-semibold tracking-tight text-foreground md:text-6xl ${
                eyebrow ? "mt-4" : ""
              }`}
              style={{ animationDelay: "120ms", animationFillMode: "both" }}
            >
              {title}
            </h1>
            <p
              className="mx-auto mt-5 max-w-3xl animate-fade-in-up text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              {description}
            </p>
            {actions ? (
              <div
                className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in-up"
                style={{ animationDelay: "280ms", animationFillMode: "both" }}
              >
                {actions}
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
