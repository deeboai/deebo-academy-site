import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { formatUsdFromCents } from "@/lib/checkout/constants";
import { listPublicCheckoutPlans } from "@/lib/checkout/service";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await listPublicCheckoutPlans();
  const cardPriceAdjustmentPercent = Number(env.cardPriceAdjustmentPercent || "3");

  return (
    <>
      <PageHero
        title="Approved enrollment plans with clear monthly pricing."
        description="Deebo Academy now uses a gated checkout flow. Approved families can review plan pricing, choose ACH or card, and complete secure monthly enrollment online."
        actions={
          <>
            <Link href="/checkout" className="primary-button">
              Enroll now
            </Link>
            <Link href="/book" className="secondary-button">
              Start intake
            </Link>
          </>
        }
      />

      <section className="pb-16">
        <div className="container">
          <Reveal className="site-panel mx-auto max-w-4xl px-6 py-8 md:px-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Monthly plans
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                These plans are purchased through the gated checkout flow after Deebo Academy
                approves the family and provides an enrollment access code.
              </p>
              <p className="mt-5 rounded-[1.35rem] border border-border/70 bg-background/55 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                ACH or bank account payments receive preferred pricing. Card payments include a{" "}
                {cardPriceAdjustmentPercent}% card price adjustment that is applied after any
                eligible promo discount.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal
                key={plan.id}
                delayMs={index * 80}
                className="site-panel flex h-full flex-col p-6 md:p-7"
              >
                <div className="flex items-start justify-between gap-3">
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

                <div className="mt-6 rounded-[1.35rem] border border-border/70 bg-background/55 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    ACH preferred price
                  </p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
                    {formatUsdFromCents(plan.monthly_price_cents)}
                    <span className="text-base font-medium text-muted-foreground">/month</span>
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Card price is calculated during checkout after any promo discount.
                  </p>
                </div>

                <ul className="mt-6 grow space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {plan.included_features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/80" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Reveal className="site-panel p-6 md:p-7">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How checkout now works
              </h2>
              <ol className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <li>1. Choose the approved plan.</li>
                <li>2. Select ACH or card pricing.</li>
                <li>3. Enter the enrollment access code provided by Deebo Academy.</li>
                <li>4. Add an optional promo code.</li>
                <li>5. Review the server-calculated monthly total and accept the legal terms.</li>
                <li>6. Complete secure payment in Stripe&apos;s embedded checkout form.</li>
              </ol>
            </Reveal>

            <Reveal delayMs={80} className="site-panel p-6 md:p-7">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Access and promo notes
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Enrollment is currently by approval only. Families cannot purchase unless they
                  have a valid Deebo Academy enrollment access code.
                </p>
                <p>
                  Promo codes are optional and are applied before any card price adjustment is
                  calculated.
                </p>
                <p>
                  If your family has not been approved yet, start with intake so Deebo Academy can
                  review the class, support level, and fit before sending checkout access.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/checkout" className="primary-button">
                  Go to checkout
                </Link>
                <Link href="/book" className="secondary-button">
                  Start intake
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
