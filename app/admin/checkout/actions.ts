"use server";

import { revalidatePath } from "next/cache";

import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  type CheckoutPaymentMethodType,
  type CheckoutPlanId,
} from "@/lib/checkout/constants";
import {
  createCheckoutAccessCode,
  updateCheckoutAccessCode,
  upsertCheckoutPlan,
  upsertCheckoutPromoCode,
} from "@/lib/checkout/service";

type AdminCheckoutActionResult = {
  ok: boolean;
  message: string;
  code?: string;
};

function parseOptionalInteger(value: number | null | undefined) {
  if (value === null || value === undefined || value === Number.NaN) {
    return null;
  }

  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value);
}

function normalizePlanId(value: string | null | undefined) {
  return value === "light" || value === "core" || value === "intensive" ? value : null;
}

function normalizePaymentMethods(value: string[] | null | undefined) {
  const supportedMethods = new Set<CheckoutPaymentMethodType>(["ach", "card"]);
  const cleaned = (value ?? []).filter((entry): entry is CheckoutPaymentMethodType =>
    supportedMethods.has(entry as CheckoutPaymentMethodType),
  );

  return cleaned.length ? cleaned : ["ach", "card"];
}

function normalizeAppliesToPlans(value: string[] | null | undefined) {
  const supportedPlans = new Set<CheckoutPlanId>(["light", "core", "intensive"]);
  return (value ?? []).filter((entry): entry is CheckoutPlanId =>
    supportedPlans.has(entry as CheckoutPlanId),
  );
}

export async function upsertCheckoutPlanAction(input: {
  id: string;
  name: string;
  monthlyPriceCents: number;
  monthlyHours: number;
  description: string;
  includedFeatures: string[];
  sortOrder: number;
  badge?: string;
  active: boolean;
}): Promise<AdminCheckoutActionResult> {
  try {
    await requireAcademyAdminUser();
    await upsertCheckoutPlan({
      id: input.id,
      name: input.name,
      monthlyPriceCents: input.monthlyPriceCents,
      monthlyHours: input.monthlyHours,
      description: input.description,
      includedFeatures: input.includedFeatures,
      sortOrder: input.sortOrder,
      badge: input.badge,
      active: input.active,
    });

    revalidatePath("/admin/checkout");
    revalidatePath("/checkout");
    revalidatePath("/pricing");

    return {
      ok: true,
      message: "Plan updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Plan could not be updated.",
    };
  }
}

export async function createCheckoutAccessCodeAction(input: {
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
  approvedPlanId?: string | null;
  allowedPaymentMethods?: string[];
  internalNote?: string;
  defaultPromoCodeId?: string | null;
  defaultPromoCodeCode?: string | null;
}): Promise<AdminCheckoutActionResult> {
  try {
    const user = await requireAcademyAdminUser();
    const result = await createCheckoutAccessCode({
      code: input.code,
      label: input.label,
      active: input.active,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      maxUses: parseOptionalInteger(input.maxUses),
      studentFirstName: input.studentFirstName,
      studentLastName: input.studentLastName,
      parentContactName: input.parentContactName,
      parentContactEmail: input.parentContactEmail,
      approvedPlanId: normalizePlanId(input.approvedPlanId),
      allowedPaymentMethods: normalizePaymentMethods(input.allowedPaymentMethods),
      internalNote: input.internalNote,
      createdByEmail: user.email ?? "",
      defaultPromoCodeId: input.defaultPromoCodeId ?? null,
      defaultPromoCodeCode: input.defaultPromoCodeCode ?? null,
    });

    revalidatePath("/admin/checkout");

    return {
      ok: true,
      message: "Access code created.",
      code: result.code,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access code could not be created.",
    };
  }
}

export async function updateCheckoutAccessCodeAction(input: {
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
  approvedPlanId?: string | null;
  allowedPaymentMethods?: string[];
  internalNote?: string;
  defaultPromoCodeId?: string | null;
  defaultPromoCodeCode?: string | null;
}): Promise<AdminCheckoutActionResult> {
  try {
    await requireAcademyAdminUser();
    await updateCheckoutAccessCode({
      id: input.id,
      label: input.label,
      active: input.active,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      maxUses: parseOptionalInteger(input.maxUses),
      studentFirstName: input.studentFirstName,
      studentLastName: input.studentLastName,
      parentContactName: input.parentContactName,
      parentContactEmail: input.parentContactEmail,
      approvedPlanId: normalizePlanId(input.approvedPlanId),
      allowedPaymentMethods: normalizePaymentMethods(input.allowedPaymentMethods),
      internalNote: input.internalNote,
      defaultPromoCodeId: input.defaultPromoCodeId ?? null,
      defaultPromoCodeCode: input.defaultPromoCodeCode ?? null,
    });

    revalidatePath("/admin/checkout");

    return {
      ok: true,
      message: "Access code updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Access code could not be updated.",
    };
  }
}

export async function upsertCheckoutPromoCodeAction(input: {
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
}): Promise<AdminCheckoutActionResult> {
  try {
    await requireAcademyAdminUser();
    await upsertCheckoutPromoCode({
      id: input.id,
      code: input.code,
      discountType: input.discountType,
      percentageOff: parseOptionalInteger(input.percentageOff),
      amountOffCents: parseOptionalInteger(input.amountOffCents),
      active: input.active,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      maxRedemptions: parseOptionalInteger(input.maxRedemptions),
      appliesToPlans: normalizeAppliesToPlans(input.appliesToPlans),
      canCombineWithAccessCode: input.canCombineWithAccessCode ?? true,
      assignedContactEmail: input.assignedContactEmail,
      internalNote: input.internalNote,
      stripeCouponId: input.stripeCouponId,
      stripePromotionCodeId: input.stripePromotionCodeId,
    });

    revalidatePath("/admin/checkout");

    return {
      ok: true,
      message: input.id ? "Promo code updated." : "Promo code created.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Promo code could not be saved.",
    };
  }
}
