"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Landmark,
  LockKeyhole,
  TicketPercent,
  X,
} from "lucide-react";

import {
  formatUsdFromCents,
  type CheckoutPaymentMethodType,
  type CheckoutPlanId,
} from "@/lib/checkout/constants";

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

type CheckoutErrorState = {
  accessCode: string;
  promoCode: string;
  parentName: string;
  parentEmail: string;
  legalAccepted: string;
  form: string;
};

const EMPTY_ERRORS: CheckoutErrorState = {
  accessCode: "",
  promoCode: "",
  parentName: "",
  parentEmail: "",
  legalAccepted: "",
  form: "",
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }

  return stripePromiseCache.get(publishableKey) ?? Promise.resolve(null);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  // Dev overlays and upstream failures do not always return JSON, so parse defensively.
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return null;
  }
}

function CheckoutStep({
  stepNumber,
  title,
  description,
  complete,
  children,
}: {
  stepNumber: number;
  title: string;
  description: string;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-border/70 bg-card px-6 py-6 shadow-[0_24px_64px_-40px_rgba(29,78,216,0.26)] md:px-7">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Step {stepNumber}
            </span>
            {complete ? (
              <span className="status-success inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
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
  const [validatedAccessCode, setValidatedAccessCode] =
    useState<CheckoutAccessCodeDetails | null>(null);
  const [eligiblePlans, setEligiblePlans] = useState<CheckoutPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<CheckoutPlanId | "">(
    initialPlanId === "light" || initialPlanId === "core" || initialPlanId === "intensive"
      ? initialPlanId
      : "",
  );
  const [paymentMethodType, setPaymentMethodType] = useState<CheckoutPaymentMethodType | "">("");
  const [promoCodeInput, setPromoCodeInput] = useState(initialPromoCode);
  const [appliedPromoCode, setAppliedPromoCode] = useState(
    initialPromoCode.trim() ? initialPromoCode.trim().toUpperCase() : "",
  );
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [errors, setErrors] = useState<CheckoutErrorState>(EMPTY_ERRORS);
  const [busyState, setBusyState] = useState<"idle" | "access" | "promo" | "checkout">("idle");
  const [isRefreshingTotal, setIsRefreshingTotal] = useState(false);
  const [calculation, setCalculation] = useState<CheckoutCalculationResponse | null>(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState("");

  const stripePromise = publishableKey ? getStripePromise(publishableKey) : null;
  const selectedPlan =
    eligiblePlans.find((plan) => plan.id === selectedPlanId) ??
    plans.find((plan) => plan.id === selectedPlanId) ??
    null;
  const allowedPaymentMethods = validatedAccessCode?.allowedPaymentMethods ?? ["ach", "card"];

  // Once the code changes, all dependent selections need to be revalidated from scratch.
  function resetVerifiedCheckoutState() {
    setValidatedAccessCode(null);
    setEligiblePlans([]);
    setSelectedPlanId("");
    setPaymentMethodType("");
    setCalculation(null);
    setCheckoutClientSecret("");
    setAppliedPromoCode("");
  }

  function updateErrors(nextValues: Partial<CheckoutErrorState>) {
    setErrors((current) => ({
      ...current,
      ...nextValues,
    }));
  }

  function clearCheckoutErrorMessages(keys: (keyof CheckoutErrorState)[]) {
    setErrors((current) => {
      const nextState = { ...current };

      keys.forEach((key) => {
        nextState[key] = "";
      });

      return nextState;
    });
  }

  async function fetchCalculation(
    requestedPromoCode: string,
    options?: {
      showPromoErrors?: boolean;
      showFormErrors?: boolean;
    },
  ) {
    if (!validatedAccessCode || !selectedPlanId || !paymentMethodType) {
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
        promo_code: requestedPromoCode,
      }),
    });

    const result = await readJsonResponse<CheckoutCalculationResponse>(response);

    if (!response.ok || !result?.valid) {
      setCalculation(null);

      if (options?.showPromoErrors && requestedPromoCode.trim()) {
        updateErrors({
          promoCode: result?.error ?? "This promo code is invalid.",
          form: "",
        });
      } else if (options?.showFormErrors) {
        updateErrors({
          form: result?.error ?? "We could not confirm the monthly total.",
        });
      }

      return null;
    }

    setCalculation(result);

    if (options?.showPromoErrors) {
      updateErrors({
        promoCode: "",
        form: "",
      });
    }

    return result;
  }

  function getPreferredPromoCode(accessCodeDetails: CheckoutAccessCodeDetails) {
    if (promoCodeInput.trim()) {
      return promoCodeInput.trim().toUpperCase();
    }

    if (accessCodeDetails.defaultPromoCode) {
      return accessCodeDetails.defaultPromoCode;
    }

    return "";
  }

  async function handleAccessCodeContinue(isAutoRun = false) {
    if (!accessCode.trim()) {
      updateErrors({
        accessCode: "Enter the access code provided by Deebo Academy.",
      });
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
    const result = await readJsonResponse<CheckoutAccessCodeResponse>(response);
    setBusyState("idle");

    if (!response.ok || !result?.valid || !result.access_code) {
      resetVerifiedCheckoutState();
      updateErrors({
        accessCode: result?.error ?? "This access code is invalid.",
        form: "",
      });
      return;
    }

    const accessCodeDetails = result.access_code;
    const eligiblePlanIds = new Set(result.eligible_plans.map((plan) => plan.id));
    const requestedPlanId =
      selectedPlanId && eligiblePlanIds.has(selectedPlanId) ? selectedPlanId : "";
    const fallbackPlanId = accessCodeDetails.approvedPlanId ?? result.eligible_plans[0]?.id ?? "";
    const nextPlanId = requestedPlanId || fallbackPlanId;
    const nextPaymentMethod =
      accessCodeDetails.allowedPaymentMethods.length === 1
        ? accessCodeDetails.allowedPaymentMethods[0]
        : "";
    const nextPromoCode = getPreferredPromoCode(accessCodeDetails);

    setValidatedAccessCode(accessCodeDetails);
    setEligiblePlans(result.eligible_plans);
    setSelectedPlanId(nextPlanId);
    setPaymentMethodType((current) => {
      if (current && accessCodeDetails.allowedPaymentMethods.includes(current)) {
        return current;
      }

      return nextPaymentMethod;
    });
    setCheckoutClientSecret("");
    setCalculation(null);
    setPromoCodeInput((current) => current || nextPromoCode);
    setAppliedPromoCode(nextPromoCode);
    clearCheckoutErrorMessages(["accessCode", "promoCode", "form"]);

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

    if (!isAutoRun && nextPlanId && nextPaymentMethod) {
      setIsRefreshingTotal(true);
      await fetchCalculation(nextPromoCode, { showFormErrors: false });
      setIsRefreshingTotal(false);
    }
  }

  async function handleApplyPromoCode() {
    if (!validatedAccessCode || !selectedPlanId || !paymentMethodType) {
      updateErrors({
        promoCode: "Confirm the approved plan and payment method before applying a promo code.",
      });
      return;
    }

    if (!promoCodeInput.trim()) {
      updateErrors({
        promoCode: "Enter a promo code to apply it.",
      });
      return;
    }

    setBusyState("promo");
    const result = await fetchCalculation(promoCodeInput.trim(), {
      showPromoErrors: true,
      showFormErrors: false,
    });
    setBusyState("idle");

    if (!result) {
      return;
    }

    setAppliedPromoCode(result.promo_applied?.code ?? promoCodeInput.trim().toUpperCase());
  }

  async function handleRemovePromoCode() {
    setPromoCodeInput("");
    setAppliedPromoCode("");
    setCheckoutClientSecret("");
    clearCheckoutErrorMessages(["promoCode", "form"]);

    if (!validatedAccessCode || !selectedPlanId || !paymentMethodType) {
      setCalculation(null);
      return;
    }

    setIsRefreshingTotal(true);
    await fetchCalculation("", { showFormErrors: false });
    setIsRefreshingTotal(false);
  }

  function validateContactFields() {
    const nextErrors: Partial<CheckoutErrorState> = {};

    if (!parentName.trim()) {
      nextErrors.parentName = "Enter the parent or guardian name.";
    }

    if (!isValidEmail(parentEmail)) {
      nextErrors.parentEmail = "Enter a valid parent or guardian email.";
    }

    if (!legalAccepted) {
      nextErrors.legalAccepted =
        "You must accept the Client Agreement, Terms of Use, and Privacy Policy before checkout.";
    }

    if (Object.keys(nextErrors).length > 0) {
      updateErrors(nextErrors);
      return false;
    }

    clearCheckoutErrorMessages(["parentName", "parentEmail", "legalAccepted"]);
    return true;
  }

  async function handleCreateCheckoutSession() {
    if (!validatedAccessCode || !selectedPlanId || !paymentMethodType || !selectedPlan) {
      updateErrors({
        form: "Verify the enrollment details before continuing to payment.",
      });
      return;
    }

    if (!validateContactFields()) {
      return;
    }

    setBusyState("checkout");
    const pricing =
      calculation ??
      (await fetchCalculation(appliedPromoCode, {
        showFormErrors: true,
      }));

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
        promo_code: appliedPromoCode,
        parent_name: parentName,
        parent_email: parentEmail,
        student_name: studentName,
        legal_acceptance_confirmed: legalAccepted,
      }),
    });

    const result = await readJsonResponse<{
      client_secret?: string;
      error?: string;
    }>(response);
    setBusyState("idle");

    if (!response.ok || !result?.client_secret) {
      updateErrors({
        form: result?.error ?? "Secure payment could not be started right now.",
      });
      return;
    }

    clearCheckoutErrorMessages(["form"]);
    setCheckoutClientSecret(result.client_secret);
  }

  useEffect(() => {
    if (!initialAccessCode.trim()) {
      return;
    }

    void handleAccessCodeContinue(true);
    // The query-string prefill should only auto-verify once when the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!validatedAccessCode || !selectedPlanId || !paymentMethodType) {
      setCalculation(null);
      return;
    }

    let cancelled = false;

    async function refreshCalculation() {
      setIsRefreshingTotal(true);
      const result = await fetchCalculation(appliedPromoCode, {
        showFormErrors: false,
      });

      if (!cancelled && !result) {
        setCalculation(null);
      }

      if (!cancelled) {
        setIsRefreshingTotal(false);
      }
    }

    void refreshCalculation();

    return () => {
      cancelled = true;
    };
    // The review total should refresh any time the verified checkout inputs change.
  }, [validatedAccessCode, selectedPlanId, paymentMethodType, appliedPromoCode]);

  const checkoutUnlocked = Boolean(validatedAccessCode);
  const planConfirmed = Boolean(selectedPlan);
  const paymentReady = Boolean(selectedPlan && paymentMethodType);
  const reviewReady = paymentReady;
  const contactComplete =
    Boolean(parentName.trim()) && isValidEmail(parentEmail) && Boolean(legalAccepted);

  const planSummary = useMemo(() => {
    if (!selectedPlan) {
      return "";
    }

    return `${selectedPlan.monthly_hours} tutoring hours/month`;
  }, [selectedPlan]);

  const appliedPromoLabel = calculation?.promo_applied?.code ?? appliedPromoCode;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.22fr)_21rem]">
      <div className="space-y-6">
        <CheckoutStep
          stepNumber={1}
          title="Verify your enrollment access code"
          description="Enrollment is approval-only. Enter the access code provided by Deebo Academy to unlock your approved monthly support plan."
          complete={checkoutUnlocked}
        >
          <label className="field-label" htmlFor="access-code">
            Enrollment access code
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="access-code"
              value={accessCode}
              onChange={(event) => {
                const nextValue = event.target.value;

                setAccessCode(nextValue);
                clearCheckoutErrorMessages(["accessCode", "form"]);
                setCheckoutClientSecret("");

                if (validatedAccessCode) {
                  resetVerifiedCheckoutState();
                }
              }}
              placeholder="Enter your Deebo Academy access code"
              className="field-input text-base"
            />
            <button
              type="button"
              onClick={() => void handleAccessCodeContinue()}
              disabled={!accessCode.trim() || busyState !== "idle"}
              className="primary-button shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyState === "access" ? "Verifying..." : "Verify code"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            This code is provided by Deebo Academy after consultation or approval.
          </p>
          {errors.accessCode ? (
            <p className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-200">
              {errors.accessCode}
            </p>
          ) : null}

          {validatedAccessCode ? (
            <div className="status-success mt-5 rounded-[1.45rem] border p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Access code confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    {validatedAccessCode.approvedPlanId
                      ? "Your approved monthly support plan is ready below."
                      : "Your approved monthly support options are ready below."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.45rem] border border-border/70 bg-background/45 p-5 text-sm leading-relaxed text-muted-foreground">
              Approval-only enrollment. Verify your code first to continue.
            </div>
          )}
        </CheckoutStep>

        {checkoutUnlocked ? (
          <>
            <CheckoutStep
              stepNumber={2}
              title="Confirm your approved plan"
              description="Review the monthly support plan approved for your family."
              complete={planConfirmed}
            >
              {eligiblePlans.length === 1 && selectedPlan ? (
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
                        {selectedPlan.monthly_hours} tutoring hours/month
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
                          setCalculation(null);
                          setCheckoutClientSecret("");
                          clearCheckoutErrorMessages(["form"]);
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
                            <span className="text-sm font-medium text-muted-foreground">
                              /month
                            </span>
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

            {planConfirmed ? (
              <CheckoutStep
                stepNumber={3}
                title="Choose your payment method"
                description="Select the payment method approved for this enrollment."
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
                      setCalculation(null);
                      setCheckoutClientSecret("");
                      clearCheckoutErrorMessages(["form"]);
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
                      setCalculation(null);
                      setCheckoutClientSecret("");
                      clearCheckoutErrorMessages(["form"]);
                    }}
                  />
                </div>
              </CheckoutStep>
            ) : null}

            {paymentReady ? (
              <CheckoutStep
                stepNumber={4}
                title="Add a promo code"
                description="Promo codes are optional and applied before payment."
                complete={Boolean(appliedPromoLabel)}
              >
                <label className="field-label" htmlFor="promo-code">
                  Promo code
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    id="promo-code"
                    value={promoCodeInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;

                      setPromoCodeInput(nextValue);
                      setCheckoutClientSecret("");
                      clearCheckoutErrorMessages(["promoCode", "form"]);

                      if (appliedPromoCode && nextValue.trim().toUpperCase() !== appliedPromoCode) {
                        setAppliedPromoCode("");
                        setCalculation(null);
                      }
                    }}
                    placeholder="Optional promo code"
                    className="field-input text-base"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyPromoCode()}
                    disabled={!promoCodeInput.trim() || busyState !== "idle"}
                    className="secondary-button shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyState === "promo" ? "Applying..." : "Apply"}
                  </button>
                  {appliedPromoLabel ? (
                    <button
                      type="button"
                      onClick={() => void handleRemovePromoCode()}
                      className="secondary-button shrink-0"
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </button>
                  ) : null}
                </div>
                {errors.promoCode ? (
                  <p className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-200">
                    {errors.promoCode}
                  </p>
                ) : null}
                {appliedPromoLabel && !errors.promoCode ? (
                  <div className="status-success mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
                    <TicketPercent className="h-4 w-4" />
                    {appliedPromoLabel} applied
                  </div>
                ) : null}
              </CheckoutStep>
            ) : null}

            {paymentReady ? (
              <CheckoutStep
                stepNumber={5}
                title="Add contact details"
                description="Confirm the parent or guardian contact details and accept the required agreements."
                complete={contactComplete}
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
                              const nextValue = event.target.value;

                              setParentName(nextValue);
                              setCheckoutClientSecret("");

                              if (nextValue.trim()) {
                                clearCheckoutErrorMessages(["parentName", "form"]);
                              }
                            }}
                            onBlur={() => {
                              if (!parentName.trim()) {
                                updateErrors({
                                  parentName: "Enter the parent or guardian name.",
                                });
                              }
                            }}
                            className="field-input text-base font-normal"
                          />
                          {errors.parentName ? (
                            <span className="text-sm font-medium text-rose-700 dark:text-rose-200">
                              {errors.parentName}
                            </span>
                          ) : null}
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-foreground">
                          Parent or guardian email
                          <input
                            type="email"
                            value={parentEmail}
                            onChange={(event) => {
                              const nextValue = event.target.value;

                              setParentEmail(nextValue);
                              setCheckoutClientSecret("");

                              if (isValidEmail(nextValue)) {
                                clearCheckoutErrorMessages(["parentEmail", "form"]);
                              }
                            }}
                            onBlur={() => {
                              if (!isValidEmail(parentEmail)) {
                                updateErrors({
                                  parentEmail: "Enter a valid parent or guardian email.",
                                });
                              }
                            }}
                            className="field-input text-base font-normal"
                          />
                          {errors.parentEmail ? (
                            <span className="text-sm font-medium text-rose-700 dark:text-rose-200">
                              {errors.parentEmail}
                            </span>
                          ) : null}
                        </label>
                      </div>
                      <label className="mt-4 grid gap-2 text-sm font-medium text-foreground">
                        Student name (optional)
                        <input
                          value={studentName}
                          onChange={(event) => {
                            setStudentName(event.target.value);
                            setCheckoutClientSecret("");
                          }}
                          className="field-input text-base font-normal"
                        />
                      </label>
                    </div>

                    <label className="flex gap-3 rounded-[1.5rem] border border-border/70 bg-background/55 p-5 text-sm leading-relaxed text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={legalAccepted}
                        onChange={(event) => {
                          const checked = event.target.checked;

                          setLegalAccepted(checked);
                          setCheckoutClientSecret("");

                          if (checked) {
                            clearCheckoutErrorMessages(["legalAccepted", "form"]);
                          }
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
                    {errors.legalAccepted ? (
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-200">
                        {errors.legalAccepted}
                      </p>
                    ) : null}
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
                        Review the final monthly total before opening secure payment.
                      </li>
                    </ul>
                  </div>
                </div>
              </CheckoutStep>
            ) : null}

            {reviewReady ? (
              <CheckoutStep
                stepNumber={6}
                title="Review monthly total"
                description="Review the approved plan, any discount, and the final monthly total before secure payment."
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                    <h3 className="text-lg font-semibold text-foreground">Enrollment summary</h3>
                    <div className="mt-5 space-y-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium text-foreground">
                          {selectedPlan?.name ?? "Not selected"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Tutoring hours</span>
                        <span className="font-medium text-foreground">
                          {planSummary || "Not selected"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Payment method</span>
                        <span className="font-medium text-foreground">
                          {paymentMethodType === "ach" ? "ACH / bank account" : "Card"}
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
                          <span className="text-base font-semibold text-foreground">
                            Final monthly total
                          </span>
                          <span className="text-2xl font-semibold tracking-tight text-foreground">
                            {calculation?.display_total ??
                              formatUsdFromCents(selectedPlan?.monthly_price_cents ?? 0)}
                            <span className="text-sm font-medium text-muted-foreground">
                              /month
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-border/70 bg-background/55 p-5">
                    <h3 className="text-lg font-semibold text-foreground">Continue to payment</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      Continue when everything above looks right. Stripe will open the secure
                      payment form below on this page.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleCreateCheckoutSession()}
                        disabled={
                          busyState !== "idle" ||
                          isRefreshingTotal ||
                          !selectedPlan ||
                          !paymentMethodType
                        }
                        className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyState === "checkout"
                          ? "Loading secure payment..."
                          : "Continue to payment"}
                      </button>
                    </div>
                    {isRefreshingTotal ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Refreshing the monthly total...
                      </p>
                    ) : null}
                  </div>
                </div>
              </CheckoutStep>
            ) : null}

            {checkoutClientSecret ? (
              <CheckoutStep
                stepNumber={7}
                title="Complete secure payment"
                description="Stripe securely collects the card or bank account details for this monthly support plan."
              >
                {stripePromise ? (
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
                  <div className="status-error rounded-[1.5rem] border p-5 text-sm leading-relaxed">
                    Secure payment is temporarily unavailable. Refresh the page and try again.
                  </div>
                )}
              </CheckoutStep>
            ) : null}
          </>
        ) : null}

        {errors.form ? (
          <div className="status-error rounded-[1.5rem] border px-5 py-4 text-sm">
            {errors.form}
          </div>
        ) : null}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Approval-only enrollment
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Verify the enrollment code first, then review the approved plan, confirm the monthly
            total, and pay securely through Stripe.
          </p>
        </section>

        {checkoutUnlocked && selectedPlan ? (
          <section className="rounded-[1.75rem] border border-border/70 bg-card/90 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Enrollment snapshot
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">{selectedPlan.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium text-foreground">
                  {paymentMethodType === "ach"
                    ? "ACH / bank account"
                    : paymentMethodType === "card"
                      ? "Card"
                      : "Choose payment method"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Monthly total</span>
                <span className="font-medium text-foreground">
                  {calculation?.display_total ??
                    formatUsdFromCents(selectedPlan.monthly_price_cents)}
                </span>
              </div>
            </div>
          </section>
        ) : null}

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
