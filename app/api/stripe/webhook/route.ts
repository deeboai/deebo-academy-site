import Stripe from "stripe";

import { env } from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

async function updatePaymentStatusByStripeIds(input: {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
  status: string;
}) {
  const supabase = getSupabaseServiceClient() as any;
  const query = supabase.from("academy_payments").update({
    status: input.status,
  });

  if (input.checkoutSessionId) {
    query.eq("stripe_checkout_session_id", input.checkoutSessionId);
  }

  if (input.paymentIntentId) {
    query.eq("stripe_payment_intent_id", input.paymentIntentId);
  }

  if (input.invoiceId) {
    query.eq("stripe_invoice_id", input.invoiceId);
  }

  const { error, data } = await query.select("session_id");

  if (error) {
    throw error;
  }

  const sessionIds = Array.from(
    new Set((data ?? []).map((row: { session_id: string | null }) => row.session_id).filter(Boolean)),
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await updatePaymentStatusByStripeIds({
        checkoutSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        status: "paid",
      });
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await updatePaymentStatusByStripeIds({
        paymentIntentId: paymentIntent.id,
        status: "paid",
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await updatePaymentStatusByStripeIds({
        paymentIntentId: paymentIntent.id,
        status: "failed",
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await updatePaymentStatusByStripeIds({
        invoiceId: invoice.id,
        status: "paid",
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await updatePaymentStatusByStripeIds({
        invoiceId: invoice.id,
        status: "failed",
      });
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
