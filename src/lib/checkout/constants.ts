export const CHECKOUT_PAYMENT_METHOD_TYPES = ["ach", "card"] as const;
export type CheckoutPaymentMethodType = (typeof CHECKOUT_PAYMENT_METHOD_TYPES)[number];

export const CHECKOUT_PLAN_IDS = ["light", "core", "intensive"] as const;
export type CheckoutPlanId = (typeof CHECKOUT_PLAN_IDS)[number];

export const CLIENT_AGREEMENT_VERSION = "2026-05-31";
export const TERMS_VERSION = "2026-05-31";
export const PRIVACY_POLICY_VERSION = "2026-05-31";
export const LEGAL_LAST_UPDATED_LABEL = "May 31, 2026";

export type CheckoutPlanSeed = {
  id: CheckoutPlanId;
  name: string;
  monthlyPriceCents: number;
  monthlyHours: number;
  description: string;
  includedFeatures: readonly string[];
  sortOrder: number;
  badge?: string;
};

export type CheckoutComparisonValue = "included" | "not_included" | string;

export type CheckoutComparisonRow = {
  feature: string;
  values: Record<CheckoutPlanId, CheckoutComparisonValue>;
};

// These plan records drive both public pricing and the seeded database defaults.
export const DEFAULT_CHECKOUT_PLANS: readonly CheckoutPlanSeed[] = [
  {
    id: "light",
    name: "Light Support",
    monthlyPriceCents: 22900,
    monthlyHours: 4,
    description: "For students who need steady weekly help without a heavier schedule.",
    includedFeatures: [
      "1–2 hour session blocks",
      "Session notes after each session",
      "Assigned homework or practice",
      "Extra student questions between sessions",
      "Best for light weekly support",
    ],
    sortOrder: 10,
  },
  {
    id: "core",
    name: "Core Support",
    monthlyPriceCents: 42900,
    monthlyHours: 8,
    description: "For students who need consistent support, test preparation, or help catching up.",
    includedFeatures: [
      "1–2 hour session blocks",
      "Session notes after each session",
      "Assigned homework or practice",
      "Extra student questions between sessions",
      "Weekly progress summary",
      "Priority scheduling",
    ],
    sortOrder: 20,
    badge: "Recommended",
  },
  {
    id: "intensive",
    name: "Intensive Support",
    monthlyPriceCents: 62900,
    monthlyHours: 12,
    description: "For demanding courses, catch-up periods, or exam-heavy months.",
    includedFeatures: [
      "1–2 hour session blocks",
      "Session notes after each session",
      "Assigned homework or practice",
      "Extra student questions between sessions",
      "Deeper exam planning",
      "Highest scheduling priority",
    ],
    sortOrder: 30,
  },
] as const;

export const DEFAULT_FOUNDER_PROMO_CODE = "DEEBOFOUNDER25";

export const CHECKOUT_COMPARISON_ROWS: readonly CheckoutComparisonRow[] = [
  {
    feature: "Monthly tutoring hours",
    values: {
      light: "4 hours",
      core: "8 hours",
      intensive: "12 hours",
    },
  },
  {
    feature: "Session length",
    values: {
      light: "1–2 hour blocks",
      core: "1–2 hour blocks",
      intensive: "1–2 hour blocks",
    },
  },
  {
    feature: "Intake-based support plan",
    values: {
      light: "included",
      core: "included",
      intensive: "included",
    },
  },
  {
    feature: "Session notes after each session",
    values: {
      light: "included",
      core: "included",
      intensive: "included",
    },
  },
  {
    feature: "Assigned homework/practice",
    values: {
      light: "included",
      core: "included",
      intensive: "included",
    },
  },
  {
    feature: "Extra student questions between sessions",
    values: {
      light: "included",
      core: "included",
      intensive: "included",
    },
  },
  {
    feature: "Weekly progress summary",
    values: {
      light: "not_included",
      core: "included",
      intensive: "included",
    },
  },
  {
    feature: "Priority scheduling",
    values: {
      light: "Standard",
      core: "Priority",
      intensive: "Highest",
    },
  },
  {
    feature: "Exam planning",
    values: {
      light: "Basic",
      core: "Included",
      intensive: "Deeper support",
    },
  },
  {
    feature: "Weak-area repair",
    values: {
      light: "Basic",
      core: "Included",
      intensive: "Intensive",
    },
  },
  {
    feature: "Best fit",
    values: {
      light: "Light weekly help",
      core: "Consistent academic support",
      intensive: "Catch-up or exam-heavy support",
    },
  },
] as const;

export const CHECKOUT_STRIPE_BRANDING = {
  displayName: "Deebo Academy",
  backgroundColor: "#f5f8fc",
  buttonColor: "#1d4ed8",
  fontFamily: "inter",
  borderStyle: "rounded" as const,
};

export function isCheckoutPaymentMethodType(
  value: string,
): value is CheckoutPaymentMethodType {
  return CHECKOUT_PAYMENT_METHOD_TYPES.includes(value as CheckoutPaymentMethodType);
}

export function isCheckoutPlanId(value: string): value is CheckoutPlanId {
  return CHECKOUT_PLAN_IDS.includes(value as CheckoutPlanId);
}

export function formatUsdFromCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}

export function getDefaultCheckoutPlanSeed(planId: CheckoutPlanId) {
  const plan = DEFAULT_CHECKOUT_PLANS.find((entry) => entry.id === planId);

  if (!plan) {
    throw new Error(`Unknown checkout plan: ${planId}`);
  }

  return plan;
}
