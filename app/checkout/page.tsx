import { PageHero } from "@/components/page-hero";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { listPublicCheckoutPlans } from "@/lib/checkout/service";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams?: Promise<{
    code?: string;
    plan?: string;
    promo?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const plans = await listPublicCheckoutPlans();
  const cardPriceAdjustmentPercent = Number(env.cardPriceAdjustmentPercent || "3");
  const params = (await searchParams) ?? {};

  return (
    <>
      <PageHero
        title="Complete your approved enrollment."
        description="Enrollment is approval-only. Enter the access code provided by Deebo Academy to confirm your approved monthly support plan and complete secure checkout."
      />

      <section className="pb-24">
        <div className="container">
          <CheckoutFlow
            plans={plans}
            publishableKey={env.publicStripePublishableKey}
            cardPriceAdjustmentPercent={cardPriceAdjustmentPercent}
            initialAccessCode={typeof params.code === "string" ? params.code : ""}
            initialPlanId={typeof params.plan === "string" ? params.plan : ""}
            initialPromoCode={typeof params.promo === "string" ? params.promo : ""}
          />
        </div>
      </section>
    </>
  );
}
