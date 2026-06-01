import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { env } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type CheckoutSuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = (await searchParams) ?? {};
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  let sessionSummary: {
    status: string;
    paymentStatus: string;
    planName: string;
  } | null = null;

  if (sessionId && env.stripeSecretKey) {
    try {
      const stripe = getStripeServerClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      sessionSummary = {
        status: session.status ?? "open",
        paymentStatus: session.payment_status ?? "unpaid",
        planName: session.metadata?.plan_name ?? "Deebo Academy plan",
      };
    } catch {
      sessionSummary = null;
    }
  }

  return (
    <>
      <PageHero
        title="Checkout received"
        description="Stripe has received your Deebo Academy enrollment checkout. We will follow the subscription status from Stripe and confirm the next steps by email."
      />

      <section className="pb-24">
        <div className="container">
          <div className="site-panel mx-auto max-w-3xl px-6 py-8 md:px-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What happens next
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Your enrollment record is now linked to Stripe. If payment is successful, Deebo
              Academy will mark the enrollment active and continue onboarding from there.
            </p>

            {sessionSummary ? (
              <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/55 p-5 text-sm md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Plan
                  </p>
                  <p className="mt-2 font-medium text-foreground">{sessionSummary.planName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Session status
                  </p>
                  <p className="mt-2 font-medium capitalize text-foreground">
                    {sessionSummary.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Payment status
                  </p>
                  <p className="mt-2 font-medium capitalize text-foreground">
                    {sessionSummary.paymentStatus.replaceAll("_", " ")}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/checkout" className="secondary-button">
                Back to checkout
              </Link>
              <Link href="/" className="primary-button">
                Return home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
