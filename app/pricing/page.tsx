import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ACADEMY_FAQS } from "@/content/academy-content";
import {
  CHECKOUT_COMPARISON_ROWS,
  DEFAULT_CHECKOUT_PLANS,
  formatUsdFromCents,
} from "@/lib/checkout/constants";
import { listPublicCheckoutPlans } from "@/lib/checkout/service";

export const dynamic = "force-dynamic";

function renderComparisonValue(value: string) {
  if (value === "included") {
    return (
      <span className="inline-flex items-center gap-2 font-medium text-foreground">
        <Check className="h-4 w-4 text-primary" />
        Included
      </span>
    );
  }

  if (value === "not_included") {
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Minus className="h-4 w-4" />
        Not included
      </span>
    );
  }

  return <span className="font-medium text-foreground">{value}</span>;
}

export default async function PricingPage() {
  const publicPlans = await listPublicCheckoutPlans();
  const planRecords = DEFAULT_CHECKOUT_PLANS.map((seed) => {
    const livePlan = publicPlans.find((entry) => entry.id === seed.id);

    return {
      ...seed,
      name: livePlan?.name ?? seed.name,
      monthlyPriceCents: livePlan?.monthly_price_cents ?? seed.monthlyPriceCents,
      monthlyHours: livePlan?.monthly_hours ?? seed.monthlyHours,
      description: livePlan?.description ?? seed.description,
      includedFeatures: livePlan?.included_features ?? seed.includedFeatures,
      badge: livePlan?.badge ?? seed.badge,
    };
  });

  return (
    <>
      <PageHero
        title="Pricing built around the student&apos;s actual class."
        description="Start with intake. We review the student&apos;s course, current challenge, goals, and schedule before recommending the right support option."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <a href="#monthly-plans" className="secondary-button">
              View monthly plans
            </a>
          </>
        }
      />

      <section id="monthly-plans" className="pb-16">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Monthly support plans
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Each plan is built around tutoring hours per month, not a fixed number of sessions.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {planRecords.map((plan, index) => (
              <Reveal
                key={plan.id}
                delayMs={index * 80}
                className={`flex h-full flex-col rounded-[1.9rem] border p-7 ${
                  plan.badge
                    ? "border-primary/40 bg-card shadow-[0_26px_70px_-42px_rgba(29,78,216,0.4)]"
                    : "border-border/70 bg-card/90"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                      {plan.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  {plan.badge ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-7 rounded-[1.55rem] border border-border/70 bg-background/60 p-5">
                  <p className="text-4xl font-semibold tracking-tight text-foreground">
                    {formatUsdFromCents(plan.monthlyPriceCents)}
                    <span className="text-base font-medium text-muted-foreground">/month</span>
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {plan.monthlyHours} tutoring hours/month
                  </p>
                </div>

                <ul className="mt-6 grow space-y-3 text-sm text-muted-foreground">
                  {plan.includedFeatures.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/85" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/book" className="primary-button mt-8 justify-center">
                  Start Intake
                </Link>
              </Reveal>
            ))}
          </div>

          <Reveal className="mx-auto mt-8 max-w-5xl rounded-[1.6rem] border border-border/70 bg-card/70 px-6 py-5 text-sm leading-relaxed text-muted-foreground md:px-8">
            Monthly support hours can be scheduled in 1-hour or 2-hour sessions. Final
            recommendations are made after intake based on course level, urgency, student needs,
            tutor fit, and availability.
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Reveal className="site-panel overflow-hidden p-0">
            <div className="border-b border-border/70 px-6 py-6 md:px-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Compare the monthly plans
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-background/70">
                  <tr className="border-b border-border/70">
                    <th className="sticky left-0 z-10 bg-background/70 px-6 py-4 font-semibold text-foreground md:px-8">
                      Feature
                    </th>
                    {planRecords.map((plan) => (
                      <th key={plan.id} className="px-6 py-4 font-semibold text-foreground">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CHECKOUT_COMPARISON_ROWS.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={index % 2 === 0 ? "bg-card/65" : "bg-background/35"}
                    >
                      <th className="sticky left-0 z-10 border-b border-border/60 bg-inherit px-6 py-4 font-medium text-foreground md:px-8">
                        {row.feature}
                      </th>
                      {planRecords.map((plan) => (
                        <td key={`${row.feature}-${plan.id}`} className="border-b border-border/60 px-6 py-4 text-muted-foreground">
                          {renderComparisonValue(row.values[plan.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl rounded-[1.7rem] border border-border/70 bg-card/90 px-6 py-6 md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Need occasional help?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Flexible tutoring may be available starting at $45/session. Most families fall
              between $45 and $70/session depending on subject, course level, and support needs.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Advanced high school, AP, college-level, in-person, or urgent support may be priced
              differently after intake.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Start with intake.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Submitting intake does not lock you into a plan. It helps us understand the class,
              the student&apos;s needs, and whether Deebo Academy is the right fit.
            </p>
            <div className="mt-7">
              <Link href="/book" className="primary-button">
                Start Intake
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <Reveal className="site-panel mx-auto max-w-4xl p-6 md:p-8">
            <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Common pricing questions
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  A few quick answers before you submit intake.
                </p>
              </div>
              <Link href="/faq" className="secondary-button">
                View full FAQ
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {ACADEMY_FAQS.slice(0, 4).map((item, index) => (
                <Reveal
                  key={item.question}
                  delayMs={index * 60}
                  className="rounded-[1.45rem] border border-border/70 bg-background/55 px-5 py-5"
                >
                  <details>
                    <summary className="cursor-pointer list-none text-base font-medium text-foreground">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <Reveal className="site-panel mx-auto max-w-4xl px-6 py-10 text-center md:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Ready to see what support fits?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Start intake and we&apos;ll review the course, current challenge, and schedule before
              recommending the right monthly support plan.
            </p>
            <div className="mt-8">
              <Link href="/book" className="primary-button">
                Start Intake
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
