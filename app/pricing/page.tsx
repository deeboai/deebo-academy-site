import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import {
  ACADEMY_FAMILY_FLOW,
  ACADEMY_PRICING_FACTORS,
  ACADEMY_PRICING_PRINCIPLES,
} from "@/content/academy-content";

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Pricing is set around the actual class, level, and tutoring cadence"
        description="We review the subject, course level, schedule, and format before recommending the tutoring plan and final rate."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <Link href="/client-agreement" className="secondary-button">
              Read Client Agreement
            </Link>
          </>
        }
      />

      <section className="pb-12">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-3">
            {ACADEMY_PRICING_PRINCIPLES.map((item, index) => (
              <Reveal
                key={item.title}
                delayMs={index * 80}
                className="site-panel hover-glow hover-lift p-7"
              >
                <h2 className="text-2xl font-semibold text-foreground">{item.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 pt-8">
        <div className="container">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Reveal className="site-panel hover-glow p-7" variant="left">
              <h2 className="text-2xl font-semibold text-foreground">How pricing is finalized</h2>
              <div className="mt-6 space-y-4">
                {ACADEMY_PRICING_FACTORS.map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-border/80 bg-background/60 px-5 py-5">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="site-panel hover-glow p-7" variant="right">
              <h2 className="text-2xl font-semibold text-foreground">What happens after intake</h2>
              <div className="mt-6 space-y-4">
                {ACADEMY_FAMILY_FLOW.map((item, index) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-border/80 bg-background/60 px-5 py-5">
                    <p className="font-medium text-foreground">{index + 1}. {item.title}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
