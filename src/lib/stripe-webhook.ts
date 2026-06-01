export type StripeCheckoutEnrollmentUpdate = {
  checkoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  stripeInvoiceId?: string | null;
  status:
    | "pending"
    | "checkout_completed"
    | "active"
    | "payment_failed"
    | "past_due"
    | "canceled"
    | "expired";
  markCheckoutCompleted?: boolean;
  markSuccess?: boolean;
}

function mapStripeSubscriptionStatus(status: unknown): StripeCheckoutEnrollmentUpdate["status"] {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "payment_failed";
    case "trialing":
      return "checkout_completed";
    default:
      return "pending";
  }
}

export function deriveStripeCheckoutEnrollmentUpdate(input: {
  eventType: string;
  object: unknown;
}): StripeCheckoutEnrollmentUpdate | null {
  const object =
    input.object && typeof input.object === "object" ? (input.object as Record<string, unknown>) : null;

  if (!object) {
    return null;
  }

  switch (input.eventType) {
    case "checkout.session.completed": {
      const paymentStatus = typeof object.payment_status === "string" ? object.payment_status : null;

      return {
        checkoutSessionId: typeof object.id === "string" ? object.id : null,
        stripeSubscriptionId: typeof object.subscription === "string" ? object.subscription : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripeInvoiceId: typeof object.invoice === "string" ? object.invoice : null,
        status: paymentStatus === "paid" ? "active" : "checkout_completed",
        markCheckoutCompleted: true,
        markSuccess: paymentStatus === "paid",
      };
    }
    case "invoice.paid":
      return {
        stripeSubscriptionId: typeof object.subscription === "string" ? object.subscription : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripeInvoiceId: typeof object.id === "string" ? object.id : null,
        status: "active",
        markSuccess: true,
      };
    case "invoice.payment_failed":
      return {
        stripeSubscriptionId: typeof object.subscription === "string" ? object.subscription : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        stripeInvoiceId: typeof object.id === "string" ? object.id : null,
        status: "payment_failed",
      };
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return {
        stripeSubscriptionId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        status: mapStripeSubscriptionStatus(object.status),
      };
    case "customer.subscription.deleted":
      return {
        stripeSubscriptionId: typeof object.id === "string" ? object.id : null,
        stripeCustomerId: typeof object.customer === "string" ? object.customer : null,
        status: "canceled",
      };
    default:
      return null;
  }
}
