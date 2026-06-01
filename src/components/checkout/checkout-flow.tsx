"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ArrowRight, BadgeCheck, CheckCircle2, CreditCard, Landmark, LockKeyhole } from "lucide-react";

import { formatUsdFromCents, type CheckoutPaymentMethodType, type CheckoutPlanId } from "@/lib/checkout/constants";

type CheckoutPlan = {
  id: CheckoutPlanId;
  name: string;
  monthly_price_cents: number;
  monthly_hours: number;
  description: string;
  included_features: string[];
  sort_order: number;
  active: boolean;
  badge: string | null;
};

type CheckoutAccessCodeDetails = {
  id: string;
  label: string | null;
  code: string | null;
  studentFirstName: string | null;
  studentLastName: string | null;
  parentContactName: string | null;
  parentContactEmail: string | null;
  approvedPlanId: CheckoutPlanId | null;
  allowedPaymentMethods: CheckoutPaymentMethodType[];
  defaultPromoCode: string | null;
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

type CheckoutAccessCodeResponse = {
  valid: boolean;
  access_code: CheckoutAccessCodeDetails | null;
  eligible_plans: CheckoutPlan[];
  error: string | null;
};

type CheckoutFlowProps = {
  plans: CheckoutPlan[];
  publishableKey: string;
  cardPriceAdjustmentPercent: number;
  initialAccessCode?: string;
  initialPlanId?: string;
  initialPromoCode?: string;
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }

  return stripePromiseCache.get(publishableKey) ?? Promise.resolve(null);
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
      className={`rounded-[1.8rem] border px-6 py-6 transition-colors md:px-7 ${
        active
          ? "border-primary/40 bg-card shadow-[0_24px_64px_-40px_rgba(29,78,216,0.36)]"
          : "border-border/70 bg-card/85"
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

function PaymentMethodCard({
  title,
  description,
  icon,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[1.5rem] border p-5 text-left transition-colors ${
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-border/70 bg-background/55 hover:border-primary/30"
      } ${disabled ? "cursor-not-allowed opacity-55 hover:border-border/70" : ""}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <p className="text-lg font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </button>
  );
}

export function CheckoutFlow({
  plans,
  publishableKey,
  cardPriceAdjustmentPercent,
  initialAccessCode = "",
  initialPlanId = "",
  initialPromoCode = "",
}: CheckoutFlowProps) {
  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [validatedAccessCode, setValidatedAccessCode] = useState<CheckoutAccessCodeDetails | null>(null);
  const [eligiblePlans, setEligiblePlans] = useState<CheckoutPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<CheckoutPlanId | "">(
    initialPlanId === "light" || initialPlanId === "core" || initialPlanId === "intensive"
      ? initialPlanId
      : "",
  );
  const [paymentMethodType, setPaymentMethodType] = useState<CheckoutPaymentMethodType | "">("");
  const [promoCode, setPromoCode] = useState(initialPromoCode);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inlineError, setInlineError] = useState("");
  const [busyState, setBusyState] = useState<"idle" | "access" | "review" | "checkout">("idle");
  const [calculation, setCalculation] = useState<CheckoutCalculationResponse | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState("");

  const stripePromise = publishableKey ? getStripePromise(publishableKey) : null;
  const planPool = eligiblePlans.length ? eligiblePlans : plans;
  const selectedPlan = planPool.find((plan) => plan.id === selectedPlanId) ?? null;
  const allowedPaymentMethods = validatedAccessCode?.allowedPaymentMethods ?? ["ach", "card"];

  useEffect(() => {
    if (!initialAccessCode.trim()) {
      return;
    }

    void handleAccessCodeContinue(true);
    // The initial query-string prefill should only auto-run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planSummary = useMemo(() => {
    if (!selectedPlan) {
      return null;
    }

    return `${selectedPlan.monthly_hours} tutoring hours/month`;
  }, [selectedPlan]);

  async function requestCalculation() {
    if (!selectedPlanId || !paymentMethodType || !validatedAccessCode) {
      setInlineError("Enter your access code, confirm the plan, and choose a payment method first.");
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

  async function handleAccessCodeContinue(isAutoRun = false) {
    if (!accessCode.trim()) {
      setInlineError("Enter the access code provided by Deebo Academy.");
      return;
    }

    setBusyState("access");
    const response = await fetch("/api/checkout/access-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_code: accessCode,
      }),
    });
    const result = (await response.json()) as CheckoutAccessCodeResponse;
    setBusyState("idle");

    if (!response.ok || !result.valid || !result.access_code) {
      setValidatedAccessCode(null);
      setEligiblePlans([]);
      setSelectedPlanId("");
      setPaymentMethodType("");
      setCheckoutClientSecret("");
      setCalculation(null);
      setInlineError(result.error ?? "This access code is invalid.");
      return;
    }
const accessCodeDetails = result.access_code;

setValidatedAccessCode(accessCodeDetails);
setEligiblePlans(result.eligible_plans);
setInlineError("");
setCheckoutClientSecret("");
setCalculation(null);

if (accessCodeDetails.parentContactName) {
  setParentName((current) => current || accessCodeDetails.parentContactName || "");
}

if (accessCodeDetails.parentContactEmail) {
  setParentEmail((current) => current || accessCodeDetails.parentContactEmail || "");
}

if (accessCodeDetails.studentFirstName || accessCodeDetails.studentLastName) {
  const nameParts = [
    accessCodeDetails.studentFirstName,
    accessCodeDetails.studentLastName,
  ].filter(Boolean);
  setStudentName((current) => current || nameParts.join(" "));
}

if (!promoCode.trim() && accessCodeDetails.defaultPromoCode) {
  setPromoCode(accessCodeDetails.defaultPromoCode);
}

const eligiblePlanIds = new Set(result.eligible_plans.map((plan) => plan.id));
const requestedPlanId =
  selectedPlanId && eligiblePlanIds.has(selectedPlanId) ? selectedPlanId : "";
const fallbackPlanId =
  accessCodeDetails.approvedPlanId ??
  result.eligible_plans[0]?.id ??
  "";
const nextPlanId = requestedPlanId || fallbackPlanId;
setSelectedPlanId(nextPlanId);

const onlyOnePaymentMethod = accessCodeDetails.allowedPaymentMethods.length === 1
  ? accessCodeDetails.allowedPaymentMethods[0]
  : "";
setPaymentMethodType((current) => {
  if (current && accessCodeDetails.allowedPaymentMethods.includes(current)) {
    return current;
  }

  return onlyOnePaymentMethod;
});

    if (isAutoRun && nextPlanId) {
      setCurrentStep(onlyOnePaymentMethod ? 4 : 2);
      return;
    }

    if (result.eligible_plans.length === 1 && onlyOnePaymentMethod) {
      setCurrentStep(4);
      return;
    }

    if (result.eligible_plans.length === 1) {
      setCurrentStep(3);
      return;
    }

    setCurrentStep(2);
  }

  async function handleReviewContinue() {
    setBusyState("review");
    const result = await requestCalculation();
    setBusyState("idle");

    if (!result) {
      return;
    }

    setCurrentStep(6);
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
    setCurrentStep(7);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
      <div className="space-y-6">
        <CheckoutStep
          stepNumber={1}
          title="Enter your enrollment access code"
          description="Enrollment is approval-only. Enter the access code provided by Deebo Academy to confirm your approved monthly support plan."
          active={currentStep === 1}
          complete={Boolean(validatedAccessCode)}
        >
          <label className="block text-sm font-medium text-foreground" htmlFor="access-code">
            Enrollment access code
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="access-code"
              value={accessCode}
              onChange={(event) => {
                setAccessCode(event.target.value);
                setValidatedAccessCode(null);
                setEligiblePlans([]);
                setSelectedPlanId("");
                setPaymentMethodType("");
                setCalculation(null);
                setCheckoutClientSecret("");
                setInlineError("");
                setCurrentStep(1);
              }}
              placeholder="Enter your Deebo Academy access code"
              className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-base text-foreground outline-none transition focus:border-primary/45"
            />
            <button
              type="button"
              onClick={() => void handleAccessCodeContinue()}
              disabled={!accessCode.trim() || busyState !== "idle"}
              className="primary-button shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyState === "access" ? "Checking..." : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This code is provided by Deebo Academy after consultation or approval.
          </p>

          {validatedAccessCode ? (
            <div className="mt-5 rounded-[1.45rem] border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Access code confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    {validatedAccessCode.approvedPlanId
                      ? "Your approved plan is ready for review below."
                      : "Your eligible monthly support options are ready for review below."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CheckoutStep>

        <CheckoutStep
          stepNumber={2}
          title="Confirm your approved plan"
          description="Review the monthly support option approved for your family."
          active={currentStep === 2}
          complete={Boolean(selectedPlan)}
        >
          {!validatedAccessCode ? (
            <div className="rounded-[1.45rem] border border-dashed border-border/70 bg-background/45 p-5 text-sm text-muted-foreground">
              Enter your access code first to see the approved plan.
            </div>
          ) : eligiblePlans.length === 1 && selectedPlan ? (
            <div className="rounded-[1.65rem] border border-primary/35 bg-primary/10 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
                    Approved plan
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {selectedPlan.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {selectedPlan.description}
                  </p>
                </div>
                {selectedPlan.badge ? (
                  <span className="rounded-full border border-primary/30 bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {selectedPlan.badge}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {formatUsdFromCents(selectedPlan.monthly_price_cents)}/month
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedPlan.monthly_hours} tutoring hours per month
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                  Sessions can be scheduled in 1-hour or 2-hour blocks.
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                {selectedPlan.included_features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/85" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="primary-button"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {eligiblePlans.map((plan) => {
                const selected = selectedPlanId === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setCurrentStep(3);
                      setCalculation(null);
                      setCheckoutClientSecret("");
                      setInlineError("");
                    }}
                    className={`rounded-[1.55rem] border p-5 text-left transition-colors ${
                      selected
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/70 bg-background/55 hover:border-primary/30"
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
                      <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {formatUsdFromCents(plan.monthly_price_cents)}
                        <span className="text-sm font-medium text-muted-foreground">/month</span>
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {plan.monthly_hours} tutoring hours/month
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CheckoutStep>

        <CheckoutStep
          stepNumber={3}
          title="Choose a payment method"
          description="Select the payment method approved for this enrollment."
          active={currentStep === 3}
          complete={Boolean(paymentMethodType)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <PaymentMethodCard
              title="ACH / bank account"
              description="Preferred pricing with no card adjustment."
              icon={<Landmark className="h-5 w-5 text-primary" />}
              selected={paymentMethodType === "ach"}
              disabled={!allowedPaymentMethods.includes("ach")}
              onClick={() => {
                setPaymentMethodType("ach");
                setCurrentStep(4);
                setCalculation(null);
                setCheckoutClientSecret("");
                setInlineError("");
              }}
            />
            <PaymentMethodCard
              title="Card"
              description={`Includes a ${cardPriceAdjustmentPercent}% card price adjustment shown before payment.`}
              icon={<CreditCard className="h-5 w-5 text-primary" />}
              selected={paymentMethodType === "card"}
              disabled={!allowedPaymentMethods.includes("card")}
              onClick={() => {
                setPaymentMethodType("card");
                setCurrentStep(4);
                setCalculation(null);
                setCheckoutClientSecret("");
                setInlineError("");
              }}
            />
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={4}
          title="Add a promo code"
          description="Promo codes are optional and applied before payment."
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
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="primary-button"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={5}
          title="Add contact details"
          description="Confirm the parent or guardian contact details and accept the required agreements."
          active={currentStep === 5}
          complete={currentStep > 5}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                <div className="grid gap-4 md:grid-cols-2">
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
              <h3 className="text-lg font-semibold text-foreground">Before payment</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-3">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Secure payment details stay inside Stripe.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/80" />
                  Promo discounts are applied before any card adjustment.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/80" />
                  You can review the final monthly total before payment loads.
                </li>
              </ul>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void handleReviewContinue()}
                  disabled={busyState !== "idle"}
                  className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyState === "review" ? "Reviewing..." : "Review monthly total"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CheckoutStep>

        <CheckoutStep
          stepNumber={6}
          title="Review monthly total"
          description="Review the approved plan, payment method, discount, and final monthly total before secure payment."
          active={currentStep === 6}
          complete={Boolean(checkoutClientSecret)}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
              <h3 className="text-lg font-semibold text-foreground">Enrollment summary</h3>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{selectedPlan?.name ?? "Not selected"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Tutoring hours</span>
                  <span className="font-medium text-foreground">{planSummary ?? "Not selected"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Payment method</span>
                  <span className="font-medium text-foreground">
                    {paymentMethodType === "ach"
                      ? "ACH / bank account"
                      : paymentMethodType === "card"
                        ? "Card"
                        : "Not selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Base monthly plan price</span>
                  <span className="font-medium text-foreground">
                    {formatUsdFromCents(
                      calculation?.base_price_cents ?? selectedPlan?.monthly_price_cents ?? 0,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Promo discount</span>
                  <span className="font-medium text-foreground">
                    -{formatUsdFromCents(calculation?.discount_cents ?? 0)}
                  </span>
                </div>
                {paymentMethodType === "card" ? (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Card price adjustment</span>
                    <span className="font-medium text-foreground">
                      {formatUsdFromCents(calculation?.card_adjustment_cents ?? 0)}
                    </span>
                  </div>
                ) : null}
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
            </div>

            <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
              <h3 className="text-lg font-semibold text-foreground">Ready for payment</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Continue when everything above looks right. Stripe will handle the secure payment
                step.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCreateCheckoutSession()}
                  disabled={busyState !== "idle"}
                  className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyState === "checkout" ? "Loading secure payment..." : "Continue to payment"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleReviewContinue()}
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
          stepNumber={7}
          title="Complete secure payment"
          description="Stripe collects the card or bank account details securely."
          active={currentStep === 7}
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
              The secure Stripe payment form will appear here after review.
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
        <section className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Approval-only enrollment
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Enter the approved access code first, then confirm the plan, review the total, and pay
            securely through Stripe.
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Current selection
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground">{selectedPlan?.name ?? "Pending"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium text-foreground">
                {paymentMethodType === "ach"
                  ? "ACH"
                  : paymentMethodType === "card"
                    ? "Card"
                    : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Monthly total</span>
              <span className="font-medium text-foreground">
                {calculation?.display_total ??
                  (selectedPlan ? formatUsdFromCents(selectedPlan.monthly_price_cents) : "Pending")}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5">
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
