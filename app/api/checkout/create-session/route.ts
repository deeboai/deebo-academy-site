import { NextResponse } from "next/server";

import type Stripe from "stripe";

import {
  calculateCheckoutPricing,
  checkoutCreateSessionSchema,
  createCheckoutEnrollmentDraft,
} from "@/lib/checkout/service";
import {
  assertCheckoutEnv,
  env,
} from "@/lib/env";
import {
  CLIENT_AGREEMENT_VERSION,
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
} from "@/lib/checkout/constants";
import { sanitizeEmailAddress, sanitizePlainText } from "@/lib/input-security";
import { getStripeServerClient } from "@/lib/stripe";

async function findOrCreateStripeCustomer(input: {
  name: string;
  email: string;
}) {
  const stripe = getStripeServerClient();
  const existingCustomers = await stripe.customers.list({
    email: input.email,
    limit: 1,
  });
  const existingCustomer = existingCustomers.data[0];

  if (existingCustomer) {
    if (existingCustomer.name !== input.name) {
      await stripe.customers.update(existingCustomer.id, {
        name: input.name,
      });
    }

    return existingCustomer;
  }

  return stripe.customers.create({
    name: input.name,
    email: input.email,
    metadata: {
      academy_customer_type: "checkout-parent",
    },
  });
}

function buildCheckoutMetadata(input: {
  pricing: Awaited<ReturnType<typeof calculateCheckoutPricing>>;
  legalAcceptanceTimestamp: string;
}) {
  if (!input.pricing.valid || !input.pricing.planId || !input.pricing.planName || !input.pricing.paymentMethodType) {
    throw new Error("Cannot build checkout metadata from invalid pricing.");
  }

  return {
    plan_id: input.pricing.planId,
    plan_name: input.pricing.planName,
    base_price_cents: String(input.pricing.basePriceCents),
    payment_method_type: input.pricing.paymentMethodType,
    promo_code: input.pricing.promoApplied?.code ?? "",
    discount_cents: String(input.pricing.discountCents),
    card_adjustment_cents: String(input.pricing.cardAdjustmentCents),
    final_total_cents: String(input.pricing.totalCents),
    access_code_id: input.pricing.accessCode?.id ?? "",
    access_code_label: input.pricing.accessCode?.label ?? "",
    legal_acceptance_timestamp: input.legalAcceptanceTimestamp,
    client_agreement_version: CLIENT_AGREEMENT_VERSION,
    terms_version: TERMS_VERSION,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
  };
}

export async function POST(request: Request) {
  assertCheckoutEnv();

  const payload = await request.json().catch(() => null);
  const parsedPayload = checkoutCreateSessionSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return NextResponse.json(
      {
        error: "Complete the checkout form before continuing.",
      },
      { status: 400 },
    );
  }

  if (!parsedPayload.data.legal_acceptance_confirmed) {
    return NextResponse.json(
      {
        error: "You must accept the Client Agreement, Terms of Use, and Privacy Policy before checkout.",
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

  if (!pricing.valid || !pricing.planId || !pricing.planName || !pricing.paymentMethodType || !pricing.accessCode) {
    return NextResponse.json(
      {
        error: pricing.error ?? "Checkout validation failed.",
      },
      { status: 400 },
    );
  }

  const parentName = sanitizePlainText(parsedPayload.data.parent_name, { maxLength: 120 });
  const parentEmail = sanitizeEmailAddress(parsedPayload.data.parent_email);
  const studentName = parsedPayload.data.student_name
    ? sanitizePlainText(parsedPayload.data.student_name, { maxLength: 120 })
    : "";
  const legalAcceptanceTimestamp = new Date().toISOString();
  const stripe = getStripeServerClient();
  const stripeCustomer = await findOrCreateStripeCustomer({
    name: parentName,
    email: parentEmail,
  });
  const metadata = buildCheckoutMetadata({
    pricing,
    legalAcceptanceTimestamp,
  });
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: pricing.totalCents,
      recurring: {
        interval: "month",
      },
      product_data: {
        name: `Deebo Academy ${pricing.planName} plan`,
        description: `${pricing.planName} monthly tutoring membership`,
      },
    },
  };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ui_mode: "embedded",
    return_url: `${env.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    redirect_on_completion: "always",
    customer: stripeCustomer.id,
    client_reference_id: `${pricing.planId}:${parentEmail}`,
    payment_method_types:
      pricing.paymentMethodType === "ach" ? ["us_bank_account"] : ["card"],
    payment_method_options:
      pricing.paymentMethodType === "ach"
        ? {
            us_bank_account: {
              verification_method: "automatic",
            },
          }
        : undefined,
    billing_address_collection: "auto",
    line_items: [lineItem],
    metadata,
    subscription_data: {
      metadata,
    },
    customer_update: {
      name: "auto",
      address: "auto",
    },
    allow_promotion_codes: false,
  });

  if (!session.client_secret) {
    return NextResponse.json(
      {
        error: "Stripe did not return an embedded checkout client secret.",
      },
      { status: 500 },
    );
  }

  await createCheckoutEnrollmentDraft(pricing, {
    parentName,
    parentEmail,
    studentName,
    legalAcceptanceTimestamp,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: stripeCustomer.id,
    promoCodeId: pricing.promoApplied?.id ?? null,
  });

  return NextResponse.json({
    client_secret: session.client_secret,
    session_id: session.id,
    publishable_key: env.publicStripePublishableKey,
  });
}
