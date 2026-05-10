import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStripePaymentMatchClauses,
  deriveStripeWebhookPaymentUpdate,
} from "../../src/lib/stripe-webhook.ts";

test("buildStripePaymentMatchClauses keeps every known Stripe identifier available for matching", () => {
  assert.deepEqual(
    buildStripePaymentMatchClauses({
      checkoutSessionId: "cs_test_123",
      paymentIntentId: "pi_test_123",
      invoiceId: "in_test_123",
    }),
    [
      "stripe_checkout_session_id.eq.cs_test_123",
      "stripe_payment_intent_id.eq.pi_test_123",
      "stripe_invoice_id.eq.in_test_123",
    ],
  );
});

test("buildStripePaymentMatchClauses drops empty identifiers", () => {
  assert.deepEqual(
    buildStripePaymentMatchClauses({
      checkoutSessionId: null,
      paymentIntentId: "pi_test_123",
      invoiceId: undefined,
    }),
    ["stripe_payment_intent_id.eq.pi_test_123"],
  );
});

test("deriveStripeWebhookPaymentUpdate maps a completed checkout session to a paid update", () => {
  assert.deepEqual(
    deriveStripeWebhookPaymentUpdate({
      eventType: "checkout.session.completed",
      object: {
        id: "cs_test_123",
        payment_intent: "pi_test_123",
        customer: "cus_test_123",
        invoice: "in_test_123",
      },
    }),
    {
      checkoutSessionId: "cs_test_123",
      paymentIntentId: "pi_test_123",
      stripeCustomerId: "cus_test_123",
      stripePaymentIntentId: "pi_test_123",
      stripeInvoiceId: "in_test_123",
      status: "paid",
    },
  );
});

test("deriveStripeWebhookPaymentUpdate maps payment intent failure events to failed status", () => {
  assert.deepEqual(
    deriveStripeWebhookPaymentUpdate({
      eventType: "payment_intent.payment_failed",
      object: {
        id: "pi_test_123",
        customer: "cus_test_123",
      },
    }),
    {
      paymentIntentId: "pi_test_123",
      stripeCustomerId: "cus_test_123",
      stripePaymentIntentId: "pi_test_123",
      status: "failed",
    },
  );
});

test("deriveStripeWebhookPaymentUpdate maps invoice events by invoice id", () => {
  assert.deepEqual(
    deriveStripeWebhookPaymentUpdate({
      eventType: "invoice.paid",
      object: {
        id: "in_test_123",
        customer: "cus_test_123",
      },
    }),
    {
      invoiceId: "in_test_123",
      stripeCustomerId: "cus_test_123",
      stripeInvoiceId: "in_test_123",
      status: "paid",
    },
  );
});

test("deriveStripeWebhookPaymentUpdate ignores unsupported event types", () => {
  assert.equal(
    deriveStripeWebhookPaymentUpdate({
      eventType: "customer.created",
      object: { id: "cus_test_123" },
    }),
    null,
  );
});
