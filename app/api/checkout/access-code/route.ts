import { NextResponse } from "next/server";

import { checkoutAccessCodeLookupSchema, validateCheckoutAccessCode } from "@/lib/checkout/service";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsedPayload = checkoutAccessCodeLookupSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        valid: false,
        access_code: null,
        eligible_plans: [],
        error: "Enter the enrollment access code provided by Deebo Academy.",
      },
      { status: 400 },
    );
  }

  const result = await validateCheckoutAccessCode(parsedPayload.data.access_code);

  return NextResponse.json(
    {
      valid: result.valid,
      access_code: result.accessCode,
      eligible_plans: result.eligiblePlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        monthly_price_cents: plan.monthly_price_cents,
        monthly_hours: plan.monthly_hours,
        description: plan.description,
        included_features: plan.included_features,
        sort_order: plan.sort_order,
        badge: plan.badge,
      })),
      error: result.error,
    },
    { status: result.valid ? 200 : 400 },
  );
}
