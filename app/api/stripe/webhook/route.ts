import type Stripe from "stripe";

import { env } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";
import {
  deriveStripeCheckoutEnrollmentUpdate,
} from "@/lib/stripe-webhook";
import { applyCheckoutEnrollmentWebhookEvent } from "@/lib/checkout/service";

const stripe = env.stripeSecretKey ? getStripeServerClient() : null;

export async function POST(request: Request) {
  if (!stripe || !env.stripeWebhookSecret) {
    return new Response("Stripe webhook is not configured.", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, env.stripeWebhookSecret);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unable to verify Stripe signature.",
      { status: 400 },
    );
  }

  const enrollmentUpdate = deriveStripeCheckoutEnrollmentUpdate({
    eventType: event.type,
    object: event.data.object,
  });

  if (enrollmentUpdate) {
    await applyCheckoutEnrollmentWebhookEvent(enrollmentUpdate);
  }

  return Response.json({ received: true });
}
