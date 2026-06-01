import { env } from "../env.ts";
import { formatUsdFromCents, type CheckoutPaymentMethodType } from "./constants.ts";
import type { CheckoutPromoCodeRecord } from "./service.ts";

function getCardPriceAdjustmentRate() {
  const parsedValue = Number(env.cardPriceAdjustmentPercent);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0.03;
  }

  return parsedValue / 100;
}

export function computeCheckoutAmounts(input: {
  basePriceCents: number;
  paymentMethodType: CheckoutPaymentMethodType;
  promoCode: Pick<CheckoutPromoCodeRecord, "discount_type" | "percentage_off" | "amount_off_cents"> | null;
}) {
  const basePriceCents = Math.max(0, Math.round(input.basePriceCents));
  let discountCents = 0;

  if (input.promoCode?.discount_type === "percentage") {
    const percentageOff = Math.max(0, input.promoCode.percentage_off ?? 0);
    discountCents = Math.round(basePriceCents * (percentageOff / 100));
  }

  if (input.promoCode?.discount_type === "fixed_amount") {
    discountCents = Math.max(0, Math.round(input.promoCode.amount_off_cents ?? 0));
  }

  discountCents = Math.min(basePriceCents, discountCents);

  const discountedSubtotalCents = Math.max(0, basePriceCents - discountCents);
  const cardAdjustmentCents =
    input.paymentMethodType === "card"
      ? Math.round(discountedSubtotalCents * getCardPriceAdjustmentRate())
      : 0;
  const totalCents = Math.max(0, discountedSubtotalCents + cardAdjustmentCents);

  return {
    basePriceCents,
    discountCents,
    cardAdjustmentCents,
    totalCents,
    displayTotal: formatUsdFromCents(totalCents),
  };
}
