import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ACADEMY_FAQS } from "@/content/academy-content";

export default function FaqPage() {
  return (
    <>
      <PageHero
        title="Common questions before booking"
        description="These answers cover how we handle intake, subject coverage, communication, and service expectations."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <Link href="/privacy" className="secondary-button">
              View Privacy Policy
            </Link>
          </>
        }
      />

      <section className="pb-24">
        <div className="container">
          <Reveal className="site-panel mx-auto max-w-4xl p-6 md:p-8">
            <div className="space-y-4">
              {ACADEMY_FAQS.map((item, index) => (
                <Reveal
                  key={item.question}
                  delayMs={index * 60}
                  className="hover-glow rounded-[1.5rem] border border-border/80 bg-background/60 px-5 py-5"
                >
                  <details>
                    <summary className="cursor-pointer list-none text-lg font-medium text-foreground">
                      {item.question}
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
