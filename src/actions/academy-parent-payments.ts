"use server";

import { redirect } from "next/navigation";

import { insertAcademyAuditEvent } from "@/lib/academy-audit";
import { getAcademyParentById } from "@/lib/academy-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";
import { getParentPortalPaymentById } from "@/lib/academy-portal-data";
import { env } from "@/lib/env";
import { getStripeServerClient } from "@/lib/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

function requirePaymentFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Missing required field: ${key}.`);
  }

  return value;
}

function getAcademyBaseUrl() {
  const configuredUrl =
    env.publicAcademySiteUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "";

  return configuredUrl.replace(/\/$/, "");
}

async function ensureStripeCustomer(input: {
  parentId: string;
  fullName: string;
  email: string;
  existingCustomerId: string | null;
}) {
  if (input.existingCustomerId) {
    return input.existingCustomerId;
  }

  const stripe = getStripeServerClient();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.fullName,
    metadata: {
      academy_parent_id: input.parentId,
    },
  });

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_parents")
    .update({
      stripe_customer_id: customer.id,
    })
    .eq("id", input.parentId);

  return customer.id;
}

export async function beginAcademyParentCheckoutAction(formData: FormData) {
  const { user, parent } = await requireAcademyParentUser();
  const paymentId = requirePaymentFormValue(formData, "payment_id");
  const payment = await getParentPortalPaymentById(parent.id, paymentId);

  if (!payment) {
    throw new Error("The selected payment record was not found.");
  }

  if (payment.status === "paid" || payment.status === "refunded" || payment.status === "waived") {
    throw new Error("This payment is not eligible for a new checkout session.");
  }

  const parentRecord = await getAcademyParentById(parent.id);

  if (!parentRecord) {
    throw new Error("The linked parent record could not be found.");
  }

  const customerId = await ensureStripeCustomer({
    parentId: parent.id,
    fullName: parentRecord.full_name,
    email: parentRecord.email,
    existingCustomerId: parentRecord.stripe_customer_id ?? payment.stripe_customer_id,
  });

  const stripe = getStripeServerClient();
  const baseUrl = getAcademyBaseUrl();

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_ACADEMY_SITE_URL is required before enabling parent checkout.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: payment.id,
    success_url: `${baseUrl}/parent/payments?checkout=success&payment=${payment.id}`,
    cancel_url: `${baseUrl}/parent/payments?checkout=cancel&payment=${payment.id}`,
    metadata: {
      academy_payment_id: payment.id,
      academy_parent_id: parent.id,
      academy_student_id: payment.student_id ?? "",
      academy_session_id: payment.session_id ?? "",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: payment.currency,
          unit_amount: payment.amount_cents,
          product_data: {
            name: payment.description || "Deebo Academy payment",
            description: payment.session_id
              ? "Academy session payment"
              : "Academy tutoring payment",
          },
        },
      },
    ],
  });

  const supabase = getSupabaseServiceClient() as any;
  await supabase
    .from("academy_payments")
    .update({
      stripe_customer_id: customerId,
      stripe_checkout_session_id: session.id,
    })
    .eq("id", payment.id);

  await insertAcademyAuditEvent({
    actor: user,
    action: "payment.checkout_started",
    targetType: "academy_payment",
    targetId: payment.id,
    targetEmail: parent.email,
    details: {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
    },
  });

  if (!session.url) {
    throw new Error("Stripe did not return a hosted checkout URL.");
  }

  redirect(session.url);
}
