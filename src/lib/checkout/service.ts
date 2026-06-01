import "server-only";

import { z } from "zod";

import { sanitizeEmailAddress, sanitizePlainText } from "@/lib/input-security";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

import { createAccessCodeHash, normalizeAccessCode, verifyAccessCodeHash } from "@/lib/checkout/access-codes";
import { decryptStoredAccessCode, encryptStoredAccessCode, generateReadableAccessCode } from "@/lib/checkout/code-secrets";
import { computeCheckoutAmounts } from "@/lib/checkout/pricing";
import {
  CHECKOUT_PAYMENT_METHOD_TYPES,
  CHECKOUT_PLAN_IDS,
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

export const checkoutAccessCodeLookupSchema = z.object({
  access_code: z.string().trim().min(1).max(120),
});

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
  monthly_hours: number;
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
  encrypted_code: string | null;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  last_used_at: string | null;
  student_first_name: string | null;
  student_last_name: string | null;
  parent_contact_name: string | null;
  parent_contact_email: string | null;
  approved_plan_id: CheckoutPlanId | null;
  allowed_payment_methods: CheckoutPaymentMethodType[] | null;
  internal_note: string | null;
  created_by_email: string | null;
  default_promo_code_id: string | null;
  default_promo_code_code: string | null;
  created_at: string;
  updated_at: string;
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
  can_combine_with_access_code: boolean;
  assigned_contact_email: string | null;
  internal_note: string | null;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  created_at: string;
  updated_at: string;
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
    approvedPlanId: CheckoutPlanId | null;
    allowedPaymentMethods: CheckoutPaymentMethodType[];
    defaultPromoCode: string | null;
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

export type CheckoutAccessCodeValidationResult = {
  valid: boolean;
  error: string | null;
  accessCode: null | {
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
  eligiblePlans: CheckoutPlanRecord[];
};

const GENERIC_ACCESS_CODE_ERROR =
  "This access code is invalid.";

function normalizePromoCode(value: string) {
  return sanitizePlainText(value, { maxLength: 80 }).toUpperCase();
}

function normalizePromoCodeLookup(value: string) {
  // The database index stores promo lookup values in lowercase even though the visible code stays uppercase.
  return normalizePromoCode(value).toLowerCase();
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

function getAllPaymentMethods() {
  return [...CHECKOUT_PAYMENT_METHOD_TYPES];
}

function normalizeAllowedPaymentMethods(
  value: CheckoutPaymentMethodType[] | null | undefined,
) {
  const cleaned = (value ?? []).filter((entry): entry is CheckoutPaymentMethodType =>
    isCheckoutPaymentMethodType(entry),
  );

  return cleaned.length ? cleaned : getAllPaymentMethods();
}

function mapDefaultPlanSeedToRecord() {
  return DEFAULT_CHECKOUT_PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    monthly_price_cents: plan.monthlyPriceCents,
    monthly_hours: plan.monthlyHours,
    description: plan.description,
    included_features: [...plan.includedFeatures],
    sort_order: plan.sortOrder,
    active: true,
    badge: plan.badge ?? null,
  })) satisfies CheckoutPlanRecord[];
}

function safeDecryptAccessCodeValue(storedValue: string | null | undefined) {
  try {
    return decryptStoredAccessCode(storedValue);
  } catch {
    return null;
  }
}

function getEligiblePlanIds(accessCode: CheckoutAccessCodeRecord | null) {
  if (accessCode?.approved_plan_id) {
    return [accessCode.approved_plan_id];
  }

  return [...CHECKOUT_PLAN_IDS];
}

function getEligiblePlansForAccessCode(
  accessCode: CheckoutAccessCodeRecord | null,
  plans: CheckoutPlanRecord[],
) {
  const eligiblePlanIds = new Set(getEligiblePlanIds(accessCode));
  return plans.filter((plan) => eligiblePlanIds.has(plan.id));
}

function mapAccessCodeErrorStatus(input: {
  record: CheckoutAccessCodeRecord | null;
  nowMs: number;
}) {
  if (!input.record) {
    return GENERIC_ACCESS_CODE_ERROR;
  }

  if (!input.record.active) {
    return "This access code is invalid.";
  }

  const startsAtMs = parseIsoDate(input.record.starts_at);
  const expiresAtMs = parseIsoDate(input.record.expires_at);

  if (startsAtMs !== null && input.nowMs < startsAtMs) {
    return "This access code is invalid.";
  }

  if (expiresAtMs !== null && input.nowMs > expiresAtMs) {
    return "This access code has expired.";
  }

  if (
    input.record.max_uses !== null &&
    input.record.use_count >= input.record.max_uses
  ) {
    return "This access code has already been used.";
  }

  return null;
}

export async function listCheckoutPlans() {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_plans")
    .select(
      "id, name, monthly_price_cents, monthly_hours, description, included_features, sort_order, active, badge",
    )
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

export async function listPublicCheckoutPlans() {
  try {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();
    const queryPromise = supabase
      .from("checkout_plans")
      .select(
        "id, name, monthly_price_cents, monthly_hours, description, included_features, sort_order, active, badge",
      )
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
    // Keep pricing and checkout pages available even if the public database read is slow.
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
    .select(
      "id, name, monthly_price_cents, monthly_hours, description, included_features, sort_order, active, badge",
    )
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
    .select(
      "id, label, code_hash, encrypted_code, active, starts_at, expires_at, max_uses, use_count, last_used_at, student_first_name, student_last_name, parent_contact_name, parent_contact_email, approved_plan_id, allowed_payment_methods, internal_note, created_by_email, default_promo_code_id, default_promo_code_code, created_at, updated_at",
    )
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
      "id, code, discount_type, percentage_off, amount_off_cents, active, starts_at, expires_at, max_redemptions, redemption_count, applies_to_plans, can_combine_with_access_code, assigned_contact_email, internal_note, stripe_coupon_id, stripe_promotion_code_id, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as CheckoutPromoCodeRecord[];
}

async function findAccessCodeByRawCode(rawAccessCode: string) {
  const normalizedAccessCode = normalizeAccessCode(rawAccessCode);
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_access_codes")
    .select(
      "id, label, code_hash, encrypted_code, active, starts_at, expires_at, max_uses, use_count, last_used_at, student_first_name, student_last_name, parent_contact_name, parent_contact_email, approved_plan_id, allowed_payment_methods, internal_note, created_by_email, default_promo_code_id, default_promo_code_code, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const accessCodes = (data ?? []) as CheckoutAccessCodeRecord[];

  return (
    accessCodes.find((accessCode) =>
      verifyAccessCodeHash(normalizedAccessCode, accessCode.code_hash),
    ) ?? null
  );
}

async function getPromoCodeById(promoCodeId: string) {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("checkout_promo_codes")
    .select(
      "id, code, discount_type, percentage_off, amount_off_cents, active, starts_at, expires_at, max_redemptions, redemption_count, applies_to_plans, can_combine_with_access_code, assigned_contact_email, internal_note, stripe_coupon_id, stripe_promotion_code_id, created_at, updated_at",
    )
    .eq("id", promoCodeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CheckoutPromoCodeRecord | null) ?? null;
}

async function getValidatedPromoCode(input: {
  rawPromoCode: string;
  planId: CheckoutPlanId;
  defaultPromoCodeId?: string | null;
}) {
  const normalizedPromoCode = normalizePromoCode(input.rawPromoCode);
  const normalizedPromoCodeLookup = normalizePromoCodeLookup(input.rawPromoCode);
  let promoCode: CheckoutPromoCodeRecord | null = null;

  if (normalizedPromoCode) {
    const supabase = getSupabaseServiceClient() as any;
    const { data, error } = await supabase
      .from("checkout_promo_codes")
      .select(
        "id, code, discount_type, percentage_off, amount_off_cents, active, starts_at, expires_at, max_redemptions, redemption_count, applies_to_plans, can_combine_with_access_code, assigned_contact_email, internal_note, stripe_coupon_id, stripe_promotion_code_id, created_at, updated_at",
      )
      .eq("normalized_code", normalizedPromoCodeLookup)
      .maybeSingle();

    if (error) {
      throw error;
    }

    promoCode = (data as CheckoutPromoCodeRecord | null) ?? null;
  } else if (input.defaultPromoCodeId) {
    promoCode = await getPromoCodeById(input.defaultPromoCodeId);
  }

  if (!promoCode) {
    if (!normalizedPromoCode) {
      return {
        promoCode: null,
        error: null,
      };
    }

    return {
      promoCode: null,
      error: "This promo code is invalid.",
    };
  }

  const nowMs = Date.now();

  if (!promoCode.active) {
    return {
      promoCode: null,
      error: "This promo code is invalid.",
    };
  }

  if (!isWithinActiveWindow({ startsAt: promoCode.starts_at, expiresAt: promoCode.expires_at, nowMs })) {
    return {
      promoCode: null,
      error:
        promoCode.expires_at && nowMs > new Date(promoCode.expires_at).getTime()
          ? "This promo code has expired."
          : "This promo code is invalid.",
    };
  }

  if (
    promoCode.max_redemptions !== null &&
    promoCode.redemption_count >= promoCode.max_redemptions
  ) {
    return {
      promoCode: null,
      error: "This promo code has already reached its redemption limit.",
    };
  }

  if (
    promoCode.applies_to_plans?.length &&
    !promoCode.applies_to_plans.includes(input.planId)
  ) {
    return {
      promoCode: null,
      error: "This promo code does not apply to this plan.",
    };
  }

  return {
    promoCode,
    error: null,
  };
}

export async function validateCheckoutAccessCode(rawAccessCode: string): Promise<CheckoutAccessCodeValidationResult> {
  const record = await findAccessCodeByRawCode(rawAccessCode);
  const nowMs = Date.now();
  const accessCodeError = mapAccessCodeErrorStatus({
    record,
    nowMs,
  });

  if (accessCodeError) {
    return {
      valid: false,
      error: accessCodeError,
      accessCode: null,
      eligiblePlans: [],
    };
  }

  const validatedRecord = record;

  if (!validatedRecord) {
    return {
      valid: false,
      error: GENERIC_ACCESS_CODE_ERROR,
      accessCode: null,
      eligiblePlans: [],
    };
  }

  const activePlans = await listActiveCheckoutPlans();
  const eligiblePlans = getEligiblePlansForAccessCode(validatedRecord, activePlans);

  return {
    valid: true,
    error: null,
    accessCode: {
      id: validatedRecord.id,
      label: validatedRecord.label,
      code: safeDecryptAccessCodeValue(validatedRecord.encrypted_code),
      studentFirstName: validatedRecord.student_first_name,
      studentLastName: validatedRecord.student_last_name,
      parentContactName: validatedRecord.parent_contact_name,
      parentContactEmail: validatedRecord.parent_contact_email,
      approvedPlanId: validatedRecord.approved_plan_id,
      allowedPaymentMethods: normalizeAllowedPaymentMethods(validatedRecord.allowed_payment_methods),
      defaultPromoCode: validatedRecord.default_promo_code_code,
    },
    eligiblePlans,
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

  const accessCodeValidation = await validateCheckoutAccessCode(input.accessCode);

  if (!accessCodeValidation.valid || !accessCodeValidation.accessCode) {
    const fallbackPlan = await getCheckoutPlan(input.planId);

    return {
      valid: false,
      error: accessCodeValidation.error ?? GENERIC_ACCESS_CODE_ERROR,
      basePriceCents: fallbackPlan?.monthly_price_cents ?? 0,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: fallbackPlan?.monthly_price_cents ?? 0,
      displayTotal: formatUsdFromCents(fallbackPlan?.monthly_price_cents ?? 0),
      promoApplied: null,
      accessCode: null,
    };
  }

  const plan = accessCodeValidation.eligiblePlans.find((entry) => entry.id === input.planId) ?? null;

  if (!plan || !plan.active) {
    return {
      valid: false,
      error: "This access code is not approved for the selected plan.",
      basePriceCents: 0,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: 0,
      displayTotal: formatUsdFromCents(0),
      promoApplied: null,
      accessCode: {
        id: accessCodeValidation.accessCode.id,
        label: accessCodeValidation.accessCode.label,
        approvedPlanId: accessCodeValidation.accessCode.approvedPlanId,
        allowedPaymentMethods: accessCodeValidation.accessCode.allowedPaymentMethods,
        defaultPromoCode: accessCodeValidation.accessCode.defaultPromoCode,
      },
    };
  }

  if (!accessCodeValidation.accessCode.allowedPaymentMethods.includes(input.paymentMethodType)) {
    return {
      valid: false,
      error: "This access code is not approved for the selected payment method.",
      basePriceCents: plan.monthly_price_cents,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: plan.monthly_price_cents,
      displayTotal: formatUsdFromCents(plan.monthly_price_cents),
      promoApplied: null,
      accessCode: {
        id: accessCodeValidation.accessCode.id,
        label: accessCodeValidation.accessCode.label,
        approvedPlanId: accessCodeValidation.accessCode.approvedPlanId,
        allowedPaymentMethods: accessCodeValidation.accessCode.allowedPaymentMethods,
        defaultPromoCode: accessCodeValidation.accessCode.defaultPromoCode,
      },
    };
  }

  const matchedAccessCode = await findAccessCodeByRawCode(input.accessCode);
  const promoValidation = await getValidatedPromoCode({
    rawPromoCode: input.promoCode ?? "",
    planId: plan.id,
    defaultPromoCodeId: matchedAccessCode?.default_promo_code_id ?? null,
  });

  if (promoValidation.error) {
    return {
      valid: false,
      error: promoValidation.error,
      planId: plan.id,
      planName: plan.name,
      paymentMethodType: input.paymentMethodType,
      basePriceCents: plan.monthly_price_cents,
      discountCents: 0,
      cardAdjustmentCents: 0,
      totalCents: plan.monthly_price_cents,
      displayTotal: formatUsdFromCents(plan.monthly_price_cents),
      promoApplied: null,
      accessCode: {
        id: accessCodeValidation.accessCode.id,
        label: accessCodeValidation.accessCode.label,
        approvedPlanId: accessCodeValidation.accessCode.approvedPlanId,
        allowedPaymentMethods: accessCodeValidation.accessCode.allowedPaymentMethods,
        defaultPromoCode: accessCodeValidation.accessCode.defaultPromoCode,
      },
    };
  }

  const amounts = computeCheckoutAmounts({
    basePriceCents: plan.monthly_price_cents,
    paymentMethodType: input.paymentMethodType,
    promoCode: promoValidation.promoCode,
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
    promoApplied: promoValidation.promoCode
      ? {
          id: promoValidation.promoCode.id,
          code: promoValidation.promoCode.code,
          discountType: promoValidation.promoCode.discount_type,
        }
      : null,
    accessCode: {
      id: accessCodeValidation.accessCode.id,
      label: accessCodeValidation.accessCode.label,
      approvedPlanId: accessCodeValidation.accessCode.approvedPlanId,
      allowedPaymentMethods: accessCodeValidation.accessCode.allowedPaymentMethods,
      defaultPromoCode: accessCodeValidation.accessCode.defaultPromoCode,
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
      monthly_hours: plan.monthlyHours,
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
  code?: string;
  label: string;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxUses?: number | null;
  studentFirstName?: string;
  studentLastName?: string;
  parentContactName?: string;
  parentContactEmail?: string;
  approvedPlanId?: CheckoutPlanId | null;
  allowedPaymentMethods?: CheckoutPaymentMethodType[];
  internalNote?: string;
  createdByEmail?: string;
  defaultPromoCodeId?: string | null;
  defaultPromoCodeCode?: string | null;
}) {
  const approvedPlanId = input.approvedPlanId && isCheckoutPlanId(input.approvedPlanId)
    ? input.approvedPlanId
    : null;
  const generatedCode = input.code?.trim()
    ? normalizeAccessCode(input.code)
    : generateReadableAccessCode(approvedPlanId ?? "core");
  const supabase = getSupabaseServiceClient() as any;
  const codeHash = createAccessCodeHash(generatedCode);
  const encryptedCode = encryptStoredAccessCode(generatedCode);
  const { error, data } = await supabase
    .from("checkout_access_codes")
    .insert({
      code_hash: codeHash,
      encrypted_code: encryptedCode,
      label: sanitizePlainText(input.label, { maxLength: 120 }),
      active: input.active,
      starts_at: input.startsAt || null,
      expires_at: input.expiresAt || null,
      max_uses: input.maxUses ?? null,
      student_first_name: input.studentFirstName
        ? sanitizePlainText(input.studentFirstName, { maxLength: 120 })
        : null,
      student_last_name: input.studentLastName
        ? sanitizePlainText(input.studentLastName, { maxLength: 120 })
        : null,
      parent_contact_name: input.parentContactName
        ? sanitizePlainText(input.parentContactName, { maxLength: 120 })
        : null,
      parent_contact_email: input.parentContactEmail
        ? sanitizeEmailAddress(input.parentContactEmail)
        : null,
      approved_plan_id: approvedPlanId,
      allowed_payment_methods: normalizeAllowedPaymentMethods(input.allowedPaymentMethods),
      internal_note: input.internalNote
        ? sanitizePlainText(input.internalNote, { maxLength: 500 })
        : null,
      created_by_email: input.createdByEmail
        ? sanitizeEmailAddress(input.createdByEmail)
        : null,
      default_promo_code_id: input.defaultPromoCodeId ?? null,
      default_promo_code_code: input.defaultPromoCodeCode
        ? normalizePromoCode(input.defaultPromoCodeCode)
        : null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: String(data.id),
    code: generatedCode,
  };
}

export async function updateCheckoutAccessCode(input: {
  id: string;
  label: string;
  active: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxUses?: number | null;
  studentFirstName?: string;
  studentLastName?: string;
  parentContactName?: string;
  parentContactEmail?: string;
  approvedPlanId?: CheckoutPlanId | null;
  allowedPaymentMethods?: CheckoutPaymentMethodType[];
  internalNote?: string;
  defaultPromoCodeId?: string | null;
  defaultPromoCodeCode?: string | null;
}) {
  const approvedPlanId = input.approvedPlanId && isCheckoutPlanId(input.approvedPlanId)
    ? input.approvedPlanId
    : null;
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("checkout_access_codes")
    .update({
      label: sanitizePlainText(input.label, { maxLength: 120 }),
      active: input.active,
      starts_at: input.startsAt || null,
      expires_at: input.expiresAt || null,
      max_uses: input.maxUses ?? null,
      student_first_name: input.studentFirstName
        ? sanitizePlainText(input.studentFirstName, { maxLength: 120 })
        : null,
      student_last_name: input.studentLastName
        ? sanitizePlainText(input.studentLastName, { maxLength: 120 })
        : null,
      parent_contact_name: input.parentContactName
        ? sanitizePlainText(input.parentContactName, { maxLength: 120 })
        : null,
      parent_contact_email: input.parentContactEmail
        ? sanitizeEmailAddress(input.parentContactEmail)
        : null,
      approved_plan_id: approvedPlanId,
      allowed_payment_methods: normalizeAllowedPaymentMethods(input.allowedPaymentMethods),
      internal_note: input.internalNote
        ? sanitizePlainText(input.internalNote, { maxLength: 500 })
        : null,
      default_promo_code_id: input.defaultPromoCodeId ?? null,
      default_promo_code_code: input.defaultPromoCodeCode
        ? normalizePromoCode(input.defaultPromoCodeCode)
        : null,
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
  monthlyHours: number;
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
    monthly_hours: Math.max(0, Math.round(input.monthlyHours)),
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
  canCombineWithAccessCode?: boolean;
  assignedContactEmail?: string;
  internalNote?: string;
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const cleanedPlans = (input.appliesToPlans ?? []).filter((planId): planId is CheckoutPlanId =>
    isCheckoutPlanId(planId),
  );
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
    applies_to_plans: cleanedPlans.length ? cleanedPlans : null,
    can_combine_with_access_code: input.canCombineWithAccessCode ?? true,
    assigned_contact_email: input.assignedContactEmail
      ? sanitizeEmailAddress(input.assignedContactEmail)
      : null,
    internal_note: input.internalNote
      ? sanitizePlainText(input.internalNote, { maxLength: 500 })
      : null,
    stripe_coupon_id: input.stripeCouponId
      ? sanitizePlainText(input.stripeCouponId, { maxLength: 120 })
      : null,
    stripe_promotion_code_id: input.stripePromotionCodeId
      ? sanitizePlainText(input.stripePromotionCodeId, { maxLength: 120 })
      : null,
  };

  const { error } = await supabase.from("checkout_promo_codes").upsert(payload);

  if (error) {
    throw error;
  }
}
