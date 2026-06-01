# Checkout Manual Test Checklist

1. Confirm `/checkout` is reachable from the main navigation and footer links still expose the legal pages publicly.
2. Verify the flow blocks progress until a plan is selected.
3. Verify the flow blocks progress until a payment method is selected.
4. Verify an invalid enrollment access code shows the general approval-only error and does not reveal whether the code exists, expired, or was maxed out.
5. Verify a valid enrollment access code allows the user to continue.
6. Verify leaving the promo field blank still allows checkout.
7. Verify an invalid promo code shows a clean error and does not change the total.
8. Verify `DEEBOFOUNDER25` applies a 25% discount.
9. Verify a fixed-amount promo reduces the base plan price correctly.
10. Verify an expired promo code is rejected.
11. Verify an inactive promo code is rejected.
12. Verify a promo code at its max redemption limit is rejected.
13. Verify card pricing adds the configured percentage after promo discount.
14. Verify ACH pricing does not add the card adjustment.
15. Verify browser-side edits to displayed totals do not affect the server-calculated Stripe session amount.
16. Verify the legal checkbox is required before the secure payment form loads.
17. Verify Stripe embedded checkout renders for ACH and card sessions without redirecting to a Payment Link.
18. Verify a successful payment creates a `checkout_enrollments` row with Stripe customer and subscription identifiers.
19. Verify the Stripe webhook updates enrollment status for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, and subscription lifecycle events.
20. Verify failed payments do not mark the enrollment active.
21. Verify promo redemption counts only increment after confirmed payment.
22. Verify access-code use counts only increment after confirmed payment.
