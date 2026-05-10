import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  if (!env.stripeSecretKey) {
    throw new Error("Stripe is not configured.");
  }

  if (!stripeClient) {
    // Keep the server-side Stripe client pinned so Academy payment flows behave consistently.
    stripeClient = new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-04-22.dahlia",
    });
  }

  return stripeClient;
}
