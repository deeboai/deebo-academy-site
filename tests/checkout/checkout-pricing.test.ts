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
      basePriceCents: 42900,
      paymentMethodType: "card",
      promoCode: {
        discount_type: "percentage",
        percentage_off: 25,
        amount_off_cents: null,
      },
    }),
    {
      basePriceCents: 42900,
      discountCents: 10725,
      cardAdjustmentCents: 965,
      totalCents: 33140,
      displayTotal: "$331.40",
    },
  );
});

test("computeCheckoutAmounts keeps ACH pricing free from the card adjustment", () => {
  assert.deepEqual(
    computeCheckoutAmounts({
      basePriceCents: 42900,
      paymentMethodType: "ach",
      promoCode: {
        discount_type: "percentage",
        percentage_off: 25,
        amount_off_cents: null,
      },
    }),
    {
      basePriceCents: 42900,
      discountCents: 10725,
      cardAdjustmentCents: 0,
      totalCents: 32175,
      displayTotal: "$321.75",
    },
  );
});

test("computeCheckoutAmounts clamps fixed discounts so totals cannot go below zero", () => {
  assert.deepEqual(
    computeCheckoutAmounts({
      basePriceCents: 22900,
      paymentMethodType: "card",
      promoCode: {
        discount_type: "fixed_amount",
        percentage_off: null,
        amount_off_cents: 999999,
      },
    }),
    {
      basePriceCents: 22900,
      discountCents: 22900,
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
