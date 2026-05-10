# Stripe Webhook Route

## Purpose

This folder contains the Stripe webhook endpoint implementation.

## Responsibilities

- receive Stripe event payloads
- verify signatures
- update Academy payment and session payment status records
- backfill Stripe identifiers onto local Academy payment rows when those identifiers arrive through webhook events

## Notes

This route should only be called by Stripe or by controlled webhook testing tools.
