import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveStripeCheckoutEnrollmentUpdate,
} from "../../src/lib/stripe-webhook.ts";

test("deriveStripeCheckoutEnrollmentUpdate marks a paid checkout session as active and successful", () => {
  assert.deepEqual(
    deriveStripeCheckoutEnrollmentUpdate({
      eventType: "checkout.session.completed",
      object: {
        id: "cs_test_123",
        customer: "cus_test_123",
        subscription: "sub_test_123",
        invoice: "in_test_123",
        payment_status: "paid",
      },
    }),
    {
      checkoutSessionId: "cs_test_123",
      stripeSubscriptionId: "sub_test_123",
      stripeCustomerId: "cus_test_123",
      stripeInvoiceId: "in_test_123",
      status: "active",
      markCheckoutCompleted: true,
      markSuccess: true,
    },
  );
});

test("deriveStripeCheckoutEnrollmentUpdate tracks failed invoice events for enrollments", () => {
  assert.deepEqual(
    deriveStripeCheckoutEnrollmentUpdate({
      eventType: "invoice.payment_failed",
      object: {
        id: "in_test_123",
        customer: "cus_test_123",
        subscription: "sub_test_123",
      },
    }),
    {
      stripeSubscriptionId: "sub_test_123",
      stripeCustomerId: "cus_test_123",
      stripeInvoiceId: "in_test_123",
      status: "payment_failed",
    },
  );
});

test("deriveStripeCheckoutEnrollmentUpdate maps subscription deletion to canceled status", () => {
  assert.deepEqual(
    deriveStripeCheckoutEnrollmentUpdate({
      eventType: "customer.subscription.deleted",
      object: {
        id: "sub_test_123",
        customer: "cus_test_123",
      },
    }),
    {
      stripeSubscriptionId: "sub_test_123",
      stripeCustomerId: "cus_test_123",
      status: "canceled",
    },
  );
});
