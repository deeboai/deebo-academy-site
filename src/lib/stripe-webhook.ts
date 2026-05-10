export type StripeWebhookPaymentUpdate = {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
  stripeCustomerId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  status: "paid" | "failed";
};

export function buildStripePaymentMatchClauses(input: {
  checkoutSessionId?: string | null;
  paymentIntentId?: string | null;
  invoiceId?: string | null;
}) {
  return [
    input.checkoutSessionId ? `stripe_checkout_session_id.eq.${input.checkoutSessionId}` : null,
    input.paymentIntentId ? `stripe_payment_intent_id.eq.${input.paymentIntentId}` : null,
    input.invoiceId ? `stripe_invoice_id.eq.${input.invoiceId}` : null,
  ].filter((value): value is string => Boolean(value));
}

export function deriveStripeWebhookPaymentUpdate(input: {
  eventType: string;
  object: unknown;
}): StripeWebhookPaymentUpdate | null {
  // Stripe unions are broad, so narrow to a plain object before reading identifier fields.
  const object =
    input.object && typeof input.object === "object" ? (input.object as Record<string, unknown>) : null;

  if (!object) {
    return null;
  }

  switch (input.eventType) {
    case "checkout.session.completed":
      return {
        checkoutSessionId: typeof object.id === "string" ? object.id : null,
        paymentIntentId: typeof object.payment_intent === "string" ? object.payment_intent : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripePaymentIntentId:
          typeof object.payment_intent === "string" ? object.payment_intent : null,
        stripeInvoiceId: typeof object.invoice === "string" ? object.invoice : null,
        status: "paid",
      };
    case "payment_intent.succeeded":
      return {
        paymentIntentId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripePaymentIntentId: typeof object.id === "string" ? object.id : null,
        status: "paid",
      };
    case "payment_intent.payment_failed":
      return {
        paymentIntentId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripePaymentIntentId: typeof object.id === "string" ? object.id : null,
        status: "failed",
      };
    case "invoice.paid":
      return {
        invoiceId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripeInvoiceId: typeof object.id === "string" ? object.id : null,
        status: "paid",
      };
    case "invoice.payment_failed":
      return {
        invoiceId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripeInvoiceId: typeof object.id === "string" ? object.id : null,
        status: "failed",
      };
    default:
      return null;
  }
}
