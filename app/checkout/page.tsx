import { PageHero } from "@/components/page-hero";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { listPublicCheckoutPlans } from "@/lib/checkout/service";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const plans = await listPublicCheckoutPlans();
  const cardPriceAdjustmentPercent = Number(env.cardPriceAdjustmentPercent || "3");

  return (
    <>
      <PageHero
        title="Enroll in Deebo Academy"
        description="Select a plan, choose ACH or card pricing, enter the enrollment access code provided by Deebo Academy, and complete secure subscription checkout."
      />

      <section className="pb-24">
        <div className="container">
          <div className="mx-auto mb-10 max-w-4xl rounded-[1.75rem] border border-border/70 bg-card/85 px-6 py-6 text-sm leading-relaxed text-muted-foreground md:px-8">
            <p>
              Enrollment is currently by approval only. Enter the access code provided by Deebo
              Academy to continue.
            </p>
            <p className="mt-3">
              ACH or bank account payments receive preferred pricing. Card payments include a{" "}
              {cardPriceAdjustmentPercent}% card price adjustment.
            </p>
          </div>

          <CheckoutFlow
            plans={plans}
            publishableKey={env.publicStripePublishableKey}
            cardPriceAdjustmentPercent={cardPriceAdjustmentPercent}
          />
        </div>
      </section>
    </>
  );
}
