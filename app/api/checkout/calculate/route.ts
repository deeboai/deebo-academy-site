import { NextResponse } from "next/server";

import {
  calculateCheckoutPricing,
  checkoutCalculationSchema,
} from "@/lib/checkout/service";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsedPayload = checkoutCalculationSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        valid: false,
        base_price_cents: 0,
        discount_cents: 0,
        card_adjustment_cents: 0,
        total_cents: 0,
        display_total: "$0.00",
        promo_applied: null,
        error: "Select a plan, choose a payment method, and enter your access code.",
      },
      { status: 400 },
    );
  }

  const pricing = await calculateCheckoutPricing({
    planId: parsedPayload.data.plan_id,
    paymentMethodType: parsedPayload.data.payment_method_type,
    accessCode: parsedPayload.data.access_code,
    promoCode: parsedPayload.data.promo_code,
  });

  return NextResponse.json(
    {
      valid: pricing.valid,
      base_price_cents: pricing.basePriceCents,
      discount_cents: pricing.discountCents,
      card_adjustment_cents: pricing.cardAdjustmentCents,
      total_cents: pricing.totalCents,
      display_total: pricing.displayTotal,
      promo_applied: pricing.promoApplied,
      error: pricing.error ?? null,
    },
    { status: pricing.valid ? 200 : 400 },
  );
}
