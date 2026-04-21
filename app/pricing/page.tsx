import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

const pricingSections = [
  {
    title: "Standard Academic Support",
    description:
      "For middle school and high school students seeking consistent help with classwork, homework, quizzes, and general subject support.",
    priceDisplay: "Typically starts at $45 per session",
  },
  {
    title: "Advanced and Honors Coursework",
    description:
      "For advanced high school, honors, AP, and introductory college-level coursework that requires deeper subject expertise.",
    priceDisplay: "Often falls within the upper end of our typical range",
  },
  {
    title: "Specialized or Intensive Support",
    description:
      "For exam-focused prep, accelerated help, high-complexity subjects, or more customized academic support.",
    priceDisplay: "Quoted after intake review",
  },
] as const;

const pricingFactors = [
  "Subject and course difficulty",
  "Grade level",
  "Session length",
  "Frequency of support",
  "One-on-one vs. small-group format",
] as const;

const pricingSteps = [
  "Submit the intake form",
  "We review the student’s needs and coursework",
  "We confirm fit, tutor availability, and pricing",
  "Sessions are booked once everything is approved",
] as const;

const pricingFaq = [
  {
    question: "Are rates fixed?",
    answer:
      "No. Pricing depends on the student’s subject, level, and support needs. We confirm the final rate after reviewing your intake.",
  },
  {
    question: "Will I know the price before booking?",
    answer:
      "Yes. We always confirm pricing before any sessions are scheduled.",
  },
  {
    question: "Why does pricing vary?",
    answer:
      "Some students need standard ongoing support, while others need advanced subject expertise or more intensive academic help. Our pricing reflects that difference.",
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Flexible pricing based on subject, level, and support needs"
        description="We keep pricing transparent without forcing every student into the same structure. Final pricing is confirmed after intake review based on course difficulty, grade level, session length, and tutor match."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <Link href="#how-pricing-works" className="secondary-button">
              View How It Works
            </Link>
          </>
        }
      />

      <section className="pb-12">
        <div className="container">
          {/* The first pricing section surfaces the range immediately so families do not have to hunt for the ballpark. */}
          <Reveal className="site-panel overflow-hidden p-0" initiallyVisible>
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-border/80 bg-card/80 px-6 py-8 md:px-8 lg:border-b-0 lg:border-r">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Rates typically start at
                </p>
                <div className="mt-5 flex items-end gap-3">
                  <span className="text-6xl font-semibold tracking-tight text-foreground md:text-7xl">
                    $45
                  </span>
                  <span className="pb-2 text-base text-muted-foreground md:text-lg">
                    per session
                  </span>
                </div>
              </div>

              <div className="px-6 py-8 md:px-8">
                <p className="text-base leading-relaxed text-foreground">
                  Most families fall between <span className="font-semibold">$45 and $70 per session</span>{" "}
                  depending on the subject, level, and format.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Advanced coursework, intensive support, and specialized tutoring may be priced
                  higher after review.
                </p>
                <p className="mt-6 text-sm font-medium text-foreground">
                  You will always receive pricing confirmation before booking.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-14">
        <div className="container">
          <div className="grid gap-5 xl:grid-cols-3">
            {pricingSections.map((section, index) => (
              <Reveal
                key={section.title}
                delayMs={index * 80}
                className="site-panel flex h-full flex-col justify-between p-7"
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <div className="mt-8 border-t border-border/80 pt-5">
                  <p className="text-base font-medium text-foreground">{section.priceDisplay}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-14" id="how-pricing-works">
        <div className="container">
          {/* The two-column middle section separates pricing inputs from the approval process so the page stays easy to scan. */}
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="site-panel p-7" variant="left">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                What affects pricing
              </h2>
              <ul className="mt-6 space-y-4">
                {pricingFactors.map((factor) => (
                  <li
                    key={factor}
                    className="flex items-start gap-3 border-b border-border/60 pb-4 text-sm leading-relaxed text-muted-foreground last:border-b-0 last:pb-0"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/80" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="site-panel p-7" variant="right">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How pricing works
              </h2>
              <div className="mt-6 space-y-4">
                {pricingSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-[1.4rem] border border-border/80 bg-background/60 px-5 py-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="container">
          <Reveal className="site-panel p-7">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pricing FAQ</h2>
              <div className="mt-6 space-y-5">
                {pricingFaq.map((item) => (
                  <div key={item.question} className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
                    <p className="text-base font-medium text-foreground">{item.question}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <Reveal className="site-panel px-6 py-8 text-center md:px-10 md:py-10">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Start with intake
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              We review the coursework, confirm fit, and send pricing before any sessions are
              booked.
            </p>
            <p className="mt-5 text-sm font-medium text-foreground">
              You will always receive pricing confirmation before booking.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/book" className="primary-button">
                Start Intake
              </Link>
              <Link href="#how-pricing-works" className="secondary-button">
                View How It Works
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
