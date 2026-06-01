"use client";

import { useState } from "react";
import Link from "next/link";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ArrowRight, BadgeCheck, CreditCard, Landmark } from "lucide-react";

import { formatUsdFromCents } from "@/lib/checkout/constants";

type CheckoutPlan = {
  id: "light" | "support" | "intensive";
  name: string;
  monthly_price_cents: number;
  description: string;
  included_features: string[];
  sort_order: number;
  active: boolean;
  badge: string | null;
};

type CheckoutCalculationResponse = {
  valid: boolean;
  base_price_cents: number;
  discount_cents: number;
  card_adjustment_cents: number;
  total_cents: number;
  display_total: string;
  promo_applied: null | {
    code: string;
  };
  error?: string | null;
};

type CheckoutFlowProps = {
  plans: CheckoutPlan[];
  publishableKey: string;
  cardPriceAdjustmentPercent: number;
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }

  return stripePromiseCache.get(publishableKey) ?? Promise.resolve(null);
}

function getIndicativeCardPrice(basePriceCents: number, cardPriceAdjustmentPercent: number) {
  return Math.round(basePriceCents * (1 + cardPriceAdjustmentPercent / 100));
}

function CheckoutStep({
  stepNumber,
  title,
  description,
  active,
  complete,
  children,
}: {
  stepNumber: number;
  title: string;
  description: string;
  active: boolean;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[1.75rem] border px-6 py-6 transition-colors md:px-7 ${
        active
          ? "border-primary/45 bg-card/95 shadow-[0_24px_70px_-42px_rgba(14,165,233,0.45)]"
          : "border-border/70 bg-card/80"
      }`}
    >
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Step {stepNumber}
            </span>
            {complete ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <BadgeCheck className="h-3.5 w-3.5" />
                Complete
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export function CheckoutFlow({
  plans,
  publishableKey,
  cardPriceAdjustmentPercent,
}: CheckoutFlowProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<CheckoutPlan["id"] | "">("");
  const [paymentMethodType, setPaymentMethodType] = useState<"ach" | "card" | "">("");
  const [accessCode, setAccessCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inlineError, setInlineError] = useState("");
  const [busyState, setBusyState] = useState<"idle" | "review" | "checkout">("idle");
  const [calculation, setCalculation] = useState<CheckoutCalculationResponse | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState("");

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;
  const stripePromise = publishableKey ? getStripePromise(publishableKey) : null;

  async function requestCalculation() {
    if (!selectedPlanId || !paymentMethodType) {
      setInlineError("Select a plan and payment method before reviewing pricing.");
      return null;
    }

    const response = await fetch("/api/checkout/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: selectedPlanId,
        payment_method_type: paymentMethodType,
        access_code: accessCode,
        promo_code: promoCode,
      }),
    });
    const result = (await response.json()) as CheckoutCalculationResponse;

    if (!response.ok || !result.valid) {
      setCalculation(result);
      setInlineError(result.error ?? "Pricing could not be calculated.");
      return null;
    }

    setInlineError("");
    setCalculation(result);
    return result;
  }

  async function handleAccessCodeContinue() {
    setBusyState("review");
    const result = await requestCalculation();
    setBusyState("idle");

    if (!result) {
      return;
    }

    setCurrentStep(4);
  }

  async function handlePromoContinue() {
    setBusyState("review");
    const result = await requestCalculation();
    setBusyState("idle");

    if (!result) {
      return;
    }

    setCurrentStep(5);
  }

  async function handleCreateCheckoutSession() {
    if (!legalAccepted) {
      setInlineError(
        "You must accept the Client Agreement, Terms of Use, and Privacy Policy before checkout.",
      );
      return;
    }

    if (!parentName.trim() || !parentEmail.trim()) {
      setInlineError("Enter the parent or guardian name and email before continuing.");
      return;
    }

    setBusyState("checkout");
    const pricing = await requestCalculation();

    if (!pricing) {
      setBusyState("idle");
      return;
    }

    const response = await fetch("/api/checkout/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: selectedPlanId,
        payment_method_type: paymentMethodType,
        access_code: accessCode,
        promo_code: promoCode,
        parent_name: parentName,
        parent_email: parentEmail,
        student_name: studentName,
        legal_acceptance_confirmed: legalAccepted,
      }),
    });
    const result = (await response.json()) as {
      client_secret?: string;
      error?: string;
    };

    setBusyState("idle");

    if (!response.ok || !result.client_secret) {
      setInlineError(result.error ?? "Stripe checkout could not be started.");
      return;
    }

    setInlineError("");
    setCheckoutClientSecret(result.client_secret);
    setCurrentStep(6);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_23rem]">
      <div className="space-y-6">
        <CheckoutStep
          stepNumber={1}
          title="Choose a plan"
          description="Select the monthly support plan that matches the level of tutoring Deebo Academy approved for your family."
          active={currentStep === 1}
          complete={Boolean(selectedPlanId)}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id;
              const indicativeCardPrice = getIndicativeCardPrice(
                plan.monthly_price_cents,
                cardPriceAdjustmentPercent,
              );

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setCurrentStep(2);
                    setCalculation(null);
                    setCheckoutClientSecret("");
                    setInlineError("");
                  }}
                  className={`rounded-[1.5rem] border p-5 text-left transition-colors ${
                    selected
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/70 bg-background/60 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-foreground">
                        {plan.name}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                    {plan.badge ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-card/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      ACH preferred price
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                      {formatUsdFromCents(plan.monthly_price_cents)}
                      <span className="text-base font-medium text-muted-foreground">/month</span>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Card price is calculated at review and is typically{" "}
                      {formatUsdFromCents(indicativeCardPrice)}/month before any promo.
                    </p>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                    {plan.included_features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/80" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={2}
          title="Choose a payment method"
          description="ACH or bank account is the preferred price. Card payments include a configurable card price adjustment that is shown before checkout."
          active={currentStep === 2}
          complete={Boolean(paymentMethodType)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setPaymentMethodType("ach");
                setCurrentStep(3);
                setCalculation(null);
                setCheckoutClientSecret("");
                setInlineError("");
              }}
              className={`rounded-[1.5rem] border p-5 text-left transition-colors ${
                paymentMethodType === "ach"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/70 bg-background/60 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-primary" />
                <p className="text-lg font-semibold text-foreground">ACH / bank account</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Preferred pricing with no added card price adjustment.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMethodType("card");
                setCurrentStep(3);
                setCalculation(null);
                setCheckoutClientSecret("");
                setInlineError("");
              }}
              className={`rounded-[1.5rem] border p-5 text-left transition-colors ${
                paymentMethodType === "card"
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/70 bg-background/60 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <p className="text-lg font-semibold text-foreground">Card</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Card payments include a {cardPriceAdjustmentPercent}% card price adjustment after
                any promo discount is applied.
              </p>
            </button>
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={3}
          title="Enter your enrollment access code"
          description="Enrollment is currently by approval only. Enter the access code provided by Deebo Academy after consultation or approval."
          active={currentStep === 3}
          complete={Boolean(accessCode.trim()) && currentStep > 3}
        >
          <label className="block text-sm font-medium text-foreground" htmlFor="access-code">
            Enrollment access code
          </label>
          <input
            id="access-code"
            value={accessCode}
            onChange={(event) => {
              setAccessCode(event.target.value);
              setInlineError("");
              setCalculation(null);
              setCheckoutClientSecret("");
            }}
            placeholder="Enter your Deebo Academy access code"
            className="mt-3 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-base text-foreground outline-none transition focus:border-primary/45"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            This code is provided by Deebo Academy after consultation or approval.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleAccessCodeContinue()}
              disabled={!selectedPlanId || !paymentMethodType || !accessCode.trim() || busyState !== "idle"}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyState === "review" && currentStep === 3 ? "Checking code..." : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={4}
          title="Add a promo code"
          description="Promo codes are optional and are applied before checkout."
          active={currentStep === 4}
          complete={currentStep > 4}
        >
          <label className="block text-sm font-medium text-foreground" htmlFor="promo-code">
            Promo code
          </label>
          <input
            id="promo-code"
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value);
              setInlineError("");
              setCalculation(null);
              setCheckoutClientSecret("");
            }}
            placeholder="Optional promo code"
            className="mt-3 w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-base text-foreground outline-none transition focus:border-primary/45"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Promo codes are optional and applied before checkout.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handlePromoContinue()}
              disabled={busyState !== "idle"}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyState === "review" && currentStep === 4 ? "Applying..." : "Review total"}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="secondary-button"
            >
              Skip promo code
            </button>
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={5}
          title="Review your monthly total"
          description="The monthly total is calculated on the server and shown here before Stripe loads the payment form."
          active={currentStep === 5}
          complete={Boolean(checkoutClientSecret)}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                <h3 className="text-lg font-semibold text-foreground">Contact details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Parent or guardian name
                    <input
                      value={parentName}
                      onChange={(event) => {
                        setParentName(event.target.value);
                        setInlineError("");
                      }}
                      className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-base font-normal text-foreground outline-none transition focus:border-primary/45"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-foreground">
                    Parent or guardian email
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(event) => {
                        setParentEmail(event.target.value);
                        setInlineError("");
                      }}
                      className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-base font-normal text-foreground outline-none transition focus:border-primary/45"
                    />
                  </label>
                </div>
                <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
                  Student name (optional)
                  <input
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-base font-normal text-foreground outline-none transition focus:border-primary/45"
                  />
                </label>
              </div>

              <label className="flex gap-3 rounded-[1.5rem] border border-border/70 bg-background/55 p-5 text-sm leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(event) => {
                    setLegalAccepted(event.target.checked);
                    setInlineError("");
                  }}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border/70"
                />
                <span>
                  I agree to Deebo Academy&apos;s{" "}
                  <Link href="/client-agreement" className="text-primary hover:underline">
                    Client Agreement
                  </Link>
                  ,{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Use
                  </Link>
                  , and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
              <h3 className="text-lg font-semibold text-foreground">Monthly pricing summary</h3>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{selectedPlan?.name ?? "Not selected"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Payment method</span>
                  <span className="font-medium capitalize text-foreground">
                    {paymentMethodType === "ach" ? "ACH / bank account" : paymentMethodType || "Not selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Base monthly plan price</span>
                  <span className="font-medium text-foreground">
                    {formatUsdFromCents(calculation?.base_price_cents ?? selectedPlan?.monthly_price_cents ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Promo discount</span>
                  <span className="font-medium text-foreground">
                    -{formatUsdFromCents(calculation?.discount_cents ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Card price adjustment</span>
                  <span className="font-medium text-foreground">
                    {formatUsdFromCents(calculation?.card_adjustment_cents ?? 0)}
                  </span>
                </div>
                <div className="border-t border-border/70 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-foreground">Final monthly total</span>
                    <span className="text-2xl font-semibold tracking-tight text-foreground">
                      {calculation?.display_total ??
                        formatUsdFromCents(selectedPlan?.monthly_price_cents ?? 0)}
                      <span className="text-sm font-medium text-muted-foreground">/month</span>
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                ACH or bank account payments receive preferred pricing. Card payments include a{" "}
                {cardPriceAdjustmentPercent}% card price adjustment. Promo codes are applied before
                checkout.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreateCheckoutSession()}
                  disabled={busyState !== "idle"}
                  className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyState === "checkout" ? "Loading secure payment form..." : "Continue to payment"}
                </button>
                <button
                  type="button"
                  onClick={() => void handlePromoContinue()}
                  disabled={busyState !== "idle"}
                  className="secondary-button"
                >
                  Refresh total
                </button>
              </div>
            </div>
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={6}
          title="Complete payment in Stripe"
          description="Stripe securely collects the card or bank account details. Deebo Academy does not receive raw payment details."
          active={currentStep === 6}
          complete={false}
        >
          {checkoutClientSecret && stripePromise ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret: checkoutClientSecret,
              }}
            >
              <div className="rounded-[1.5rem] border border-border/70 bg-background/60 p-3 md:p-4">
                <EmbeddedCheckout />
              </div>
            </EmbeddedCheckoutProvider>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/45 p-5 text-sm leading-relaxed text-muted-foreground">
              The secure payment form will appear here after review.
            </div>
          )}
        </CheckoutStep>

        {inlineError ? (
          <div className="rounded-[1.5rem] border border-rose-500/35 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {inlineError}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Approval only
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Enrollment is currently by approval only. Enter the access code provided by Deebo
            Academy to continue.
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Pricing rules
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Promo discounts apply to the base plan price first.</li>
            <li>Card price adjustment is applied after any promo discount.</li>
            <li>Final totals are calculated on the server before Stripe is loaded.</li>
          </ul>
        </section>

        <section className="rounded-[1.75rem] border border-border/70 bg-card/85 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Legal links
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/client-agreement" className="text-foreground hover:text-primary">
              Client Agreement
            </Link>
            <Link href="/terms" className="text-foreground hover:text-primary">
              Terms of Use
            </Link>
            <Link href="/privacy" className="text-foreground hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </section>
      </aside>
    </div>
  );
}
