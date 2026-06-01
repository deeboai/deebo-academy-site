"use server";

import { revalidatePath } from "next/cache";

import {
  createCheckoutAccessCode,
  updateCheckoutAccessCode,
  upsertCheckoutPlan,
  upsertCheckoutPromoCode,
} from "@/lib/checkout/service";

function parseOptionalInteger(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.round(parsedValue) : null;
}

function parseTextareaLines(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function upsertCheckoutPlanAction(formData: FormData) {
  await upsertCheckoutPlan({
    id: String(formData.get("id") ?? ""),
    name: String(formData.get("name") ?? ""),
    monthlyPriceCents: Number(formData.get("monthly_price_cents") ?? 0),
    description: String(formData.get("description") ?? ""),
    includedFeatures: parseTextareaLines(formData.get("included_features")),
    sortOrder: Number(formData.get("sort_order") ?? 100),
    badge: String(formData.get("badge") ?? ""),
    active: formData.get("active") === "on",
  });

  revalidatePath("/admin/checkout");
  revalidatePath("/checkout");
  revalidatePath("/pricing");
}

export async function createCheckoutAccessCodeAction(formData: FormData) {
  await createCheckoutAccessCode({
    code: String(formData.get("code") ?? ""),
    label: String(formData.get("label") ?? ""),
    active: formData.get("active") === "on",
    startsAt: String(formData.get("starts_at") ?? ""),
    expiresAt: String(formData.get("expires_at") ?? ""),
    maxUses: parseOptionalInteger(formData.get("max_uses")),
  });

  revalidatePath("/admin/checkout");
}

export async function updateCheckoutAccessCodeAction(formData: FormData) {
  await updateCheckoutAccessCode({
    id: String(formData.get("id") ?? ""),
    label: String(formData.get("label") ?? ""),
    active: formData.get("active") === "on",
    startsAt: String(formData.get("starts_at") ?? ""),
    expiresAt: String(formData.get("expires_at") ?? ""),
    maxUses: parseOptionalInteger(formData.get("max_uses")),
  });

  revalidatePath("/admin/checkout");
}

export async function upsertCheckoutPromoCodeAction(formData: FormData) {
  const appliesToPlans = parseTextareaLines(formData.get("applies_to_plans"));

  await upsertCheckoutPromoCode({
    id: String(formData.get("id") ?? "") || undefined,
    code: String(formData.get("code") ?? ""),
    discountType:
      String(formData.get("discount_type") ?? "") === "fixed_amount"
        ? "fixed_amount"
        : "percentage",
    percentageOff: parseOptionalInteger(formData.get("percentage_off")),
    amountOffCents: parseOptionalInteger(formData.get("amount_off_cents")),
    active: formData.get("active") === "on",
    startsAt: String(formData.get("starts_at") ?? ""),
    expiresAt: String(formData.get("expires_at") ?? ""),
    maxRedemptions: parseOptionalInteger(formData.get("max_redemptions")),
    appliesToPlans,
  });

  revalidatePath("/admin/checkout");
}
