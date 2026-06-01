import assert from "node:assert/strict";
import test from "node:test";

import {
  computeCheckoutAmounts,
} from "../../src/lib/checkout/pricing.ts";
import {
  createAccessCodeHash,
  verifyAccessCodeHash,
} from "../../src/lib/checkout/access-codes.ts";

test("computeCheckoutAmounts applies percentage promo before the card adjustment", () => {
  assert.deepEqual(
    computeCheckoutAmounts({
      basePriceCents: 29900,
      paymentMethodType: "card",
      promoCode: {
        discount_type: "percentage",
        percentage_off: 25,
        amount_off_cents: null,
      },
    }),
    {
      basePriceCents: 29900,
      discountCents: 7475,
      cardAdjustmentCents: 673,
      totalCents: 23098,
      displayTotal: "$230.98",
    },
  );
});

test("computeCheckoutAmounts keeps ACH pricing free from the card adjustment", () => {
  assert.deepEqual(
    computeCheckoutAmounts({
      basePriceCents: 29900,
      paymentMethodType: "ach",
      promoCode: {
        discount_type: "percentage",
        percentage_off: 25,
        amount_off_cents: null,
      },
    }),
    {
      basePriceCents: 29900,
      discountCents: 7475,
      cardAdjustmentCents: 0,
      totalCents: 22425,
      displayTotal: "$224.25",
    },
  );
});

test("computeCheckoutAmounts clamps fixed discounts so totals cannot go below zero", () => {
  assert.deepEqual(
    computeCheckoutAmounts({
      basePriceCents: 14900,
      paymentMethodType: "card",
      promoCode: {
        discount_type: "fixed_amount",
        percentage_off: null,
        amount_off_cents: 999999,
      },
    }),
    {
      basePriceCents: 14900,
      discountCents: 14900,
      cardAdjustmentCents: 0,
      totalCents: 0,
      displayTotal: "$0.00",
    },
  );
});

test("access code hashes validate the original code without storing plaintext", () => {
  const accessCode = "academy-parent-approval";
  const hashedCode = createAccessCodeHash(accessCode);

  assert.notEqual(hashedCode, accessCode);
  assert.equal(verifyAccessCodeHash(accessCode, hashedCode), true);
  assert.equal(verifyAccessCodeHash("wrong-code", hashedCode), false);
});
