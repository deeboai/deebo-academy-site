import type Stripe from "stripe";

import { env } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";
import {
  buildStripePaymentMatchClauses,
  deriveStripeWebhookPaymentUpdate,
} from "@/lib/stripe-webhook";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const stripe = env.stripeSecretKey ? getStripeServerClient() : null;

async function updatePaymentStatusByStripeIds(input: {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
  stripeCustomerId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  status: string;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const matchClauses = buildStripePaymentMatchClauses({
    checkoutSessionId: input.checkoutSessionId,
    paymentIntentId: input.paymentIntentId,
    invoiceId: input.invoiceId,
  });

  if (!matchClauses.length) {
    return;
  }

  // Match by any Stripe identifier because webhook events can arrive before every identifier has been persisted locally.
  const { data: matchingPayments, error: selectError } = await supabase
    .from("academy_payments")
    .select("id, session_id")
    .or(matchClauses.join(","));

  if (selectError) {
    throw selectError;
  }

  const paymentIds = (matchingPayments ?? []).map((row: { id: string }) => row.id);

  if (!paymentIds.length) {
    return;
  }

  const { error } = await supabase
    .from("academy_payments")
    .update({
      status: input.status,
      stripe_customer_id: input.stripeCustomerId ?? undefined,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? undefined,
      stripe_invoice_id: input.stripeInvoiceId ?? undefined,
    })
    .in("id", paymentIds)
    .select("session_id");

  if (error) {
    throw error;
  }

  const sessionIds = Array.from(
    new Set((matchingPayments ?? []).map((row: { session_id: string | null }) => row.session_id).filter(Boolean)),
  ) as string[];

  if (!sessionIds.length) {
    return;
  }

  await supabase
    .from("academy_sessions")
    .update({
      payment_status: input.status,
    })
    .in("id", sessionIds);
}

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

  const paymentUpdate = deriveStripeWebhookPaymentUpdate({
    eventType: event.type,
    object: event.data.object,
  });

  if (paymentUpdate) {
    await updatePaymentStatusByStripeIds(paymentUpdate);
  }

  return Response.json({ received: true });
}
