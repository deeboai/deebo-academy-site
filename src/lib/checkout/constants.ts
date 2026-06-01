export const CHECKOUT_PAYMENT_METHOD_TYPES = ["ach", "card"] as const;
export type CheckoutPaymentMethodType = (typeof CHECKOUT_PAYMENT_METHOD_TYPES)[number];

export const CHECKOUT_PLAN_IDS = ["light", "support", "intensive"] as const;
export type CheckoutPlanId = (typeof CHECKOUT_PLAN_IDS)[number];

export const CLIENT_AGREEMENT_VERSION = "2026-05-31";
export const TERMS_VERSION = "2026-05-31";
export const PRIVACY_POLICY_VERSION = "2026-05-31";
export const LEGAL_LAST_UPDATED_LABEL = "May 31, 2026";

export type CheckoutPlanSeed = {
  id: CheckoutPlanId;
  name: string;
  monthlyPriceCents: number;
  description: string;
  includedFeatures: readonly string[];
  sortOrder: number;
  badge?: string;
};

// Keep the public marketing plan copy aligned with the seeded database records.
export const DEFAULT_CHECKOUT_PLANS: readonly CheckoutPlanSeed[] = [
  {
    id: "light",
    name: "Light",
    monthlyPriceCents: 14900,
    description: "Steady weekly support for students who need consistent help without the heaviest schedule.",
    includedFeatures: [
      "1 live session each week",
      "Session notes after each meeting",
      "Assigned practice between sessions",
      "Email follow-up for parent coordination",
    ],
    sortOrder: 10,
  },
  {
    id: "support",
    name: "Support",
    monthlyPriceCents: 29900,
    description: "The standard plan for recurring tutoring, test prep, and ongoing academic repair.",
    includedFeatures: [
      "Up to 2 live sessions each week",
      "Session notes and practice after each meeting",
      "Progress check-ins for families",
      "Priority scheduling compared with Light",
    ],
    sortOrder: 20,
    badge: "Recommended",
  },
  {
    id: "intensive",
    name: "Intensive",
    monthlyPriceCents: 59900,
    description: "Higher-frequency support for major catch-up periods, demanding courses, or exam-heavy stretches.",
    includedFeatures: [
      "Multiple weekly sessions for heavier support",
      "Detailed progress tracking",
      "Priority scheduling for urgent academic needs",
      "Planning support for exams and major deadlines",
    ],
    sortOrder: 30,
  },
] as const;

export const DEFAULT_FOUNDER_PROMO_CODE = "DEEBOFOUNDER25";

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
