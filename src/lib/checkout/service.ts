import "server-only";

import { z } from "zod";

import { sanitizeEmailAddress, sanitizePlainText } from "@/lib/input-security";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { createAccessCodeHash, normalizeAccessCode, verifyAccessCodeHash } from "@/lib/checkout/access-codes";
import { computeCheckoutAmounts } from "@/lib/checkout/pricing";
import {
  CLIENT_AGREEMENT_VERSION,
  DEFAULT_CHECKOUT_PLANS,
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
  formatUsdFromCents,
  isCheckoutPaymentMethodType,
  isCheckoutPlanId,
  type CheckoutPaymentMethodType,
  type CheckoutPlanId,
} from "@/lib/checkout/constants";

export const checkoutCalculationSchema = z.object({
  plan_id: z.string().trim().min(1),
  payment_method_type: z.enum(["ach", "card"]),
  access_code: z.string().trim().min(1).max(120),
  promo_code: z.string().trim().max(80).optional().or(z.literal("")),
});

export const checkoutCreateSessionSchema = checkoutCalculationSchema.extend({
  parent_name: z.string().trim().min(1).max(120),
  parent_email: z.string().trim().email().max(320),
  student_name: z.string().trim().max(120).optional().or(z.literal("")),
  legal_acceptance_confirmed: z.boolean(),
});

export type CheckoutPlanRecord = {
  id: CheckoutPlanId;
  name: string;
  monthly_price_cents: number;
  description: string;
  included_features: string[];
  sort_order: number;
  active: boolean;
  badge: string | null;
};

export type CheckoutAccessCodeRecord = {
  id: string;
  label: string | null;
  code_hash: string;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
};

export type CheckoutPromoCodeRecord = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  percentage_off: number | null;
  amount_off_cents: number | null;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  applies_to_plans: string[] | null;
};

export type CheckoutPricingResult = {
  valid: boolean;
  error?: string;
  planId?: CheckoutPlanId;
  planName?: string;
  paymentMethodType?: CheckoutPaymentMethodType;
  basePriceCents: number;
  discountCents: number;
  cardAdjustmentCents: number;
  totalCents: number;
  displayTotal: string;
  promoApplied: null | {
    id: string;
    code: string;
    discountType: "percentage" | "fixed_amount";
  };
  accessCode: null | {
    id: string;
    label: string | null;
  };
};

export type CheckoutEnrollmentDraft = {
  parentName: string;
  parentEmail: string;
  studentName?: string;
  legalAcceptanceTimestamp: string;
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  promoCodeId: string | null;
};

const GENERIC_ACCESS_CODE_ERROR =
  "Enrollment is currently by approval only. Enter the access code provided by Deebo Academy to continue.";

function getNowIso() {
  return new Date().toISOString();
}

function normalizePromoCode(value: string) {
  return sanitizePlainText(value, { maxLength: 80 }).toUpperCase();
}

function parseIsoDate(value: string | null) {
  return value ? new Date(value).getTime() : null;
}

function isWithinActiveWindow(input: {
  startsAt: string | null;
  expiresAt: string | null;
  nowMs: number;
}) {
  const startsAtMs = parseIsoDate(input.startsAt);
  const expiresAtMs = parseIsoDate(input.expiresAt);

  if (startsAtMs !== null && input.nowMs < startsAtMs) {
    return false;
  }

  if (expiresAtMs !== null && input.nowMs > expiresAtMs) {
    return false;
  }

  return true;
}

export async function listCheckoutPlans() {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_plans")
    .select("id, name, monthly_price_cents, description, included_features, sort_order, active, badge")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CheckoutPlanRecord[];
}

export async function listActiveCheckoutPlans() {
  const plans = await listCheckoutPlans();
  return plans.filter((plan) => plan.active);
}

function mapDefaultPlanSeedToRecord() {
  return DEFAULT_CHECKOUT_PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    monthly_price_cents: plan.monthlyPriceCents,
    description: plan.description,
    included_features: [...plan.includedFeatures],
    sort_order: plan.sortOrder,
    active: true,
    badge: plan.badge ?? null,
  })) satisfies CheckoutPlanRecord[];
}

export async function listPublicCheckoutPlans() {
  try {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();
    const queryPromise = supabase
      .from("checkout_plans")
      .select("id, name, monthly_price_cents, description, included_features, sort_order, active, badge")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timed out loading public checkout plans.")), 1500);
    });
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      throw error;
    }

    const plans = (data ?? []) as CheckoutPlanRecord[];

    return plans.length ? plans : mapDefaultPlanSeedToRecord();
  } catch {
    // Public pricing routes should stay available even if Supabase is temporarily unavailable.
    return mapDefaultPlanSeedToRecord();
  }
}

export async function getCheckoutPlan(planId: string) {
  if (!isCheckoutPlanId(planId)) {
    return null;
  }

  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_plans")
    .select("id, name, monthly_price_cents, description, included_features, sort_order, active, badge")
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CheckoutPlanRecord | null) ?? null;
}

export async function listCheckoutAccessCodes() {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_access_codes")
    .select("id, label, code_hash, active, starts_at, expires_at, max_uses, use_count, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CheckoutAccessCodeRecord[];
}

export async function listCheckoutPromoCodes() {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_promo_codes")
    .select(
      "id, code, discount_type, percentage_off, amount_off_cents, active, starts_at, expires_at, max_redemptions, redemption_count, applies_to_plans, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CheckoutPromoCodeRecord[];
}

async function getActiveAccessCodeMatch(rawAccessCode: string) {
  const normalizedAccessCode = normalizeAccessCode(rawAccessCode);
  const nowMs = Date.now();
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_access_codes")
    .select("id, label, code_hash, active, starts_at, expires_at, max_uses, use_count")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const accessCodes = (data ?? []) as CheckoutAccessCodeRecord[];

  return (
    accessCodes.find((accessCode) => {
      if (!isWithinActiveWindow({ startsAt: accessCode.starts_at, expiresAt: accessCode.expires_at, nowMs })) {
        return false;
      }

      if (accessCode.max_uses !== null && accessCode.use_count >= accessCode.max_uses) {
        return false;
      }

      return verifyAccessCodeHash(normalizedAccessCode, accessCode.code_hash);
    }) ?? null
  );
}

async function getValidatedPromoCode(input: {
  rawPromoCode: string;
  planId: CheckoutPlanId;
}) {
  const normalizedPromoCode = normalizePromoCode(input.rawPromoCode);

  if (!normalizedPromoCode) {
    return {
      promoCode: null,
      error: null,
    };
  }

  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_promo_codes")
    .select(
      "id, code, discount_type, percentage_off, amount_off_cents, active, starts_at, expires_at, max_redemptions, redemption_count, applies_to_plans",
    )
    .eq("normalized_code", normalizedPromoCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const promoCode = (data as CheckoutPromoCodeRecord | null) ?? null;

  if (!promoCode) {
    return {
      promoCode: null,
      error: "This promo code could not be applied.",
    };
  }

  const nowMs = Date.now();

  if (!promoCode.active || !isWithinActiveWindow({ startsAt: promoCode.starts_at, expiresAt: promoCode.expires_at, nowMs })) {
    return {
      promoCode: null,
      error: "This promo code could not be applied.",
    };
  }

  if (
    promoCode.max_redemptions !== null &&
    promoCode.redemption_count >= promoCode.max_redemptions
  ) {
    return {
      promoCode: null,
      error: "This promo code has reached its redemption limit.",
    };
  }

  if (
    promoCode.applies_to_plans?.length &&
    !promoCode.applies_to_plans.includes(input.planId)
  ) {
    return {
      promoCode: null,
      error: "This promo code does not apply to the selected plan.",
    };
  }

  return {
    promoCode,
    error: null,
  };
}

export async function calculateCheckoutPricing(input: {
  planId: string;
  paymentMethodType: string;
  accessCode: string;
  promoCode?: string;
}): Promise<CheckoutPricingResult> {
  if (!isCheckoutPlanId(input.planId) || !isCheckoutPaymentMethodType(input.paymentMethodType)) {
    return {
      valid: false,
      error: "Select a valid plan and payment method.",
      basePriceCents: 0,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: 0,
      displayTotal: formatUsdFromCents(0),
      promoApplied: null,
      accessCode: null,
    };
  }

  const plan = await getCheckoutPlan(input.planId);

  if (!plan || !plan.active) {
    return {
      valid: false,
      error: "The selected plan is not available right now.",
      basePriceCents: 0,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: 0,
      displayTotal: formatUsdFromCents(0),
      promoApplied: null,
      accessCode: null,
    };
  }

  const accessCode = await getActiveAccessCodeMatch(input.accessCode);

  if (!accessCode) {
    return {
      valid: false,
      error: GENERIC_ACCESS_CODE_ERROR,
      basePriceCents: plan.monthly_price_cents,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: plan.monthly_price_cents,
      displayTotal: formatUsdFromCents(plan.monthly_price_cents),
      promoApplied: null,
      accessCode: null,
    };
  }

  let promoCode: CheckoutPromoCodeRecord | null = null;

  if (input.promoCode?.trim()) {
    const promoValidation = await getValidatedPromoCode({
      rawPromoCode: input.promoCode,
      planId: plan.id,
    });

    if (promoValidation.error) {
      return {
        valid: false,
        error: promoValidation.error,
        basePriceCents: plan.monthly_price_cents,
        discountCents: 0,
        cardAdjustmentCents: 0,
        totalCents: plan.monthly_price_cents,
        displayTotal: formatUsdFromCents(plan.monthly_price_cents),
        promoApplied: null,
        accessCode: {
          id: accessCode.id,
          label: accessCode.label,
        },
      };
    }

    promoCode = promoValidation.promoCode;
  }

  const amounts = computeCheckoutAmounts({
    basePriceCents: plan.monthly_price_cents,
    paymentMethodType: input.paymentMethodType,
    promoCode,
  });

  return {
    valid: true,
    planId: plan.id,
    planName: plan.name,
    paymentMethodType: input.paymentMethodType,
    basePriceCents: amounts.basePriceCents,
    discountCents: amounts.discountCents,
    cardAdjustmentCents: amounts.cardAdjustmentCents,
    totalCents: amounts.totalCents,
    displayTotal: amounts.displayTotal,
    promoApplied: promoCode
      ? {
          id: promoCode.id,
          code: promoCode.code,
          discountType: promoCode.discount_type,
        }
      : null,
    accessCode: {
      id: accessCode.id,
      label: accessCode.label,
    },
  };
}

export async function createCheckoutEnrollmentDraft(
  pricing: CheckoutPricingResult,
  input: CheckoutEnrollmentDraft,
) {
  if (!pricing.valid || !pricing.planId || !pricing.planName || !pricing.paymentMethodType || !pricing.accessCode) {
    throw new Error("Cannot create an enrollment draft for invalid checkout pricing.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_enrollments")
    .insert({
      parent_name: sanitizePlainText(input.parentName, { maxLength: 120 }),
      parent_email: sanitizeEmailAddress(input.parentEmail),
      student_name: input.studentName ? sanitizePlainText(input.studentName, { maxLength: 120 }) : null,
      plan_id: pricing.planId,
      plan_name: pricing.planName,
      payment_method_type: pricing.paymentMethodType,
      base_price_cents: pricing.basePriceCents,
      discount_cents: pricing.discountCents,
      card_adjustment_cents: pricing.cardAdjustmentCents,
      final_total_cents: pricing.totalCents,
      promo_code: pricing.promoApplied?.code ?? null,
      promo_code_id: input.promoCodeId,
      access_code_id: pricing.accessCode.id,
      access_code_label: pricing.accessCode.label ?? null,
      stripe_customer_id: input.stripeCustomerId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      status: "pending",
      legal_acceptance_timestamp: input.legalAcceptanceTimestamp,
      client_agreement_version: CLIENT_AGREEMENT_VERSION,
      terms_version: TERMS_VERSION,
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data as { id: string };
}

export async function updateCheckoutEnrollmentStripeFields(input: {
  checkoutSessionId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("checkout_enrollments")
    .update({
      stripe_customer_id: input.stripeCustomerId ?? undefined,
      stripe_subscription_id: input.stripeSubscriptionId ?? undefined,
      stripe_invoice_id: input.stripeInvoiceId ?? undefined,
    })
    .eq("stripe_checkout_session_id", input.checkoutSessionId);

  if (error) {
    throw error;
  }
}

export async function applyCheckoutEnrollmentWebhookEvent(input: {
  checkoutSessionId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  status: string;
  markCheckoutCompleted?: boolean;
  markSuccess?: boolean;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase.rpc("apply_checkout_enrollment_event", {
    target_checkout_session_id: input.checkoutSessionId ?? null,
    target_stripe_subscription_id: input.stripeSubscriptionId ?? null,
    target_stripe_invoice_id: input.stripeInvoiceId ?? null,
    target_stripe_customer_id: input.stripeCustomerId ?? null,
    next_status: input.status,
    mark_checkout_completed: input.markCheckoutCompleted ?? false,
    mark_success: input.markSuccess ?? false,
  });

  if (error) {
    throw error;
  }
}

export async function seedCheckoutPlansIfMissing() {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase.from("checkout_plans").select("id").limit(1);

  if (error) {
    throw error;
  }

  if ((data ?? []).length > 0) {
    return;
  }

  const { error: insertError } = await supabase.from("checkout_plans").insert(
    DEFAULT_CHECKOUT_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      monthly_price_cents: plan.monthlyPriceCents,
      description: plan.description,
      included_features: [...plan.includedFeatures],
      sort_order: plan.sortOrder,
      badge: plan.badge ?? null,
      active: true,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

export async function createCheckoutAccessCode(input: {
  code: string;
  label: string;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxUses?: number | null;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const codeHash = createAccessCodeHash(input.code);
  const { error } = await supabase.from("checkout_access_codes").insert({
    code_hash: codeHash,
    label: sanitizePlainText(input.label, { maxLength: 120 }),
    active: input.active,
    starts_at: input.startsAt || null,
    expires_at: input.expiresAt || null,
    max_uses: input.maxUses ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function updateCheckoutAccessCode(input: {
  id: string;
  label: string;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxUses?: number | null;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("checkout_access_codes")
    .update({
      label: sanitizePlainText(input.label, { maxLength: 120 }),
      active: input.active,
      starts_at: input.startsAt || null,
      expires_at: input.expiresAt || null,
      max_uses: input.maxUses ?? null,
    })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

export async function upsertCheckoutPlan(input: {
  id: string;
  name: string;
  monthlyPriceCents: number;
  description: string;
  includedFeatures: string[];
  sortOrder: number;
  badge?: string;
  active: boolean;
}) {
  if (!isCheckoutPlanId(input.id)) {
    throw new Error("Unsupported checkout plan id.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase.from("checkout_plans").upsert({
    id: input.id,
    name: sanitizePlainText(input.name, { maxLength: 80 }),
    monthly_price_cents: Math.max(0, Math.round(input.monthlyPriceCents)),
    description: sanitizePlainText(input.description, { maxLength: 600 }),
    included_features: input.includedFeatures.map((feature) =>
      sanitizePlainText(feature, { maxLength: 160 }),
    ),
    sort_order: Math.round(input.sortOrder),
    badge: input.badge ? sanitizePlainText(input.badge, { maxLength: 40 }) : null,
    active: input.active,
  });

  if (error) {
    throw error;
  }
}

export async function upsertCheckoutPromoCode(input: {
  id?: string;
  code: string;
  discountType: "percentage" | "fixed_amount";
  percentageOff?: number | null;
  amountOffCents?: number | null;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number | null;
  appliesToPlans?: string[];
}) {
  const supabase = getSupabaseServiceClient() as any;
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    code: normalizePromoCode(input.code),
    discount_type: input.discountType,
    percentage_off: input.discountType === "percentage" ? input.percentageOff ?? 0 : null,
    amount_off_cents:
      input.discountType === "fixed_amount"
        ? Math.max(0, Math.round(input.amountOffCents ?? 0))
        : null,
    active: input.active,
    starts_at: input.startsAt || null,
    expires_at: input.expiresAt || null,
    max_redemptions: input.maxRedemptions ?? null,
    applies_to_plans: input.appliesToPlans?.length ? input.appliesToPlans : null,
  };

  const { error } = await supabase.from("checkout_promo_codes").upsert(payload);

  if (error) {
    throw error;
  }
}
