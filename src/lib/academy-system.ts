import "server-only";

import {
  env,
  hasAcademyEmailEnv,
  hasGoogleCalendarAutomationEnv,
  hasPublicSupabaseEnv,
  hasServiceRoleKey,
} from "@/lib/env";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AcademySystemCheckStatus = "ok" | "warning" | "error";

export type AcademySystemCheck = {
  id: string;
  label: string;
  status: AcademySystemCheckStatus;
  detail: string;
};

export type AcademySystemSection = {
  title: string;
  description: string;
  checks: AcademySystemCheck[];
};

function buildCheck(input: AcademySystemCheck) {
  return input;
}

async function runSupabaseTableCheck(input: {
  table: string;
  label: string;
  successDetail: string;
  missingDetail: string;
}) {
  if (!hasPublicSupabaseEnv || !hasServiceRoleKey) {
    return buildCheck({
      id: input.table,
      label: input.label,
      status: "error",
      detail: "Supabase public env or service-role env is missing, so this check cannot run.",
    });
  }

  try {
    const supabase = getSupabaseServiceClient() as any;
    const { error } = await supabase.from(input.table).select("id", { head: true, count: "exact" }).limit(1);

    if (error) {
      return buildCheck({
        id: input.table,
        label: input.label,
        status: "error",
        detail: `${input.missingDetail} Supabase returned: ${error.message}`,
      });
    }

    return buildCheck({
      id: input.table,
      label: input.label,
      status: "ok",
      detail: input.successDetail,
    });
  } catch (error) {
    return buildCheck({
      id: input.table,
      label: input.label,
      status: "error",
      detail: `${input.missingDetail} ${error instanceof Error ? error.message : "Unknown Supabase error."}`,
    });
  }
}

async function runAdminBootstrapCheck() {
  if (!hasPublicSupabaseEnv || !hasServiceRoleKey) {
    return buildCheck({
      id: "admin-bootstrap",
      label: "Admin bootstrap row",
      status: "error",
      detail: "Supabase public env or service-role env is missing, so admin bootstrap cannot be verified.",
    });
  }

  try {
    const supabase = getSupabaseServiceClient() as any;
    const { data, error } = await supabase
      .from("academy_portal_accounts")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();

    if (error) {
      return buildCheck({
        id: "admin-bootstrap",
        label: "Admin bootstrap row",
        status: "error",
        detail: `Could not verify admin access rows. Supabase returned: ${error.message}`,
      });
    }

    if (!data) {
      return buildCheck({
        id: "admin-bootstrap",
        label: "Admin bootstrap row",
        status: "warning",
        detail:
          "No admin row exists in academy_portal_accounts yet. Run supabase/scripts/bootstrap_academy_admin_access.sql before relying on admin login.",
      });
    }

    return buildCheck({
      id: "admin-bootstrap",
      label: "Admin bootstrap row",
      status: "ok",
      detail: "At least one admin access row exists in academy_portal_accounts.",
    });
  } catch (error) {
    return buildCheck({
      id: "admin-bootstrap",
      label: "Admin bootstrap row",
      status: "error",
      detail: `Could not verify admin access rows. ${error instanceof Error ? error.message : "Unknown Supabase error."}`,
    });
  }
}

export async function getAcademySystemHealth() {
  const envSection: AcademySystemSection = {
    title: "Environment",
    description: "Server-side configuration required for auth, email, payments, and invite redirects.",
    checks: [
      buildCheck({
        id: "supabase-public-env",
        label: "Supabase public env",
        status: hasPublicSupabaseEnv ? "ok" : "error",
        detail: hasPublicSupabaseEnv
          ? "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are present."
          : "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
      }),
      buildCheck({
        id: "supabase-service-role",
        label: "Supabase service role",
        status: hasServiceRoleKey ? "ok" : "error",
        detail: hasServiceRoleKey
          ? "SUPABASE_SERVICE_ROLE_KEY is present."
          : "SUPABASE_SERVICE_ROLE_KEY is missing.",
      }),
      buildCheck({
        id: "academy-site-url",
        label: "Invite redirect URL",
        status: env.publicAcademySiteUrl ? "ok" : "warning",
        detail: env.publicAcademySiteUrl
          ? `NEXT_PUBLIC_ACADEMY_SITE_URL is set to ${env.publicAcademySiteUrl}.`
          : "NEXT_PUBLIC_ACADEMY_SITE_URL is missing. Invite and reset flows will fall back to deployment URL env when available.",
      }),
      buildCheck({
        id: "academy-email-env",
        label: "Resend email env",
        status: hasAcademyEmailEnv && Boolean(env.academyNotificationEmail) ? "ok" : "warning",
        detail:
          hasAcademyEmailEnv && env.academyNotificationEmail
            ? "RESEND_API_KEY, ACADEMY_FROM_EMAIL, and ACADEMY_NOTIFICATION_EMAIL are present."
            : "Email env is incomplete. Invites, recaps, and notifications will not be fully reliable until RESEND_API_KEY, ACADEMY_FROM_EMAIL, and ACADEMY_NOTIFICATION_EMAIL are set.",
      }),
      buildCheck({
        id: "stripe-env",
        label: "Stripe env",
        status:
          env.stripeSecretKey && env.stripeWebhookSecret && env.publicStripePublishableKey
            ? "ok"
            : "warning",
        detail:
          env.stripeSecretKey && env.stripeWebhookSecret && env.publicStripePublishableKey
            ? "Stripe secret, webhook, and publishable keys are present."
            : "Stripe env is incomplete. Parent-facing payment flow is not ready until all Stripe keys are set.",
      }),
      buildCheck({
        id: "google-calendar-env",
        label: "Google Calendar env",
        status: hasGoogleCalendarAutomationEnv ? "ok" : "warning",
        detail:
          hasGoogleCalendarAutomationEnv
            ? "Google Calendar client, refresh token, and calendar ID env are present."
            : "Google Calendar env is incomplete. Automatic event creation needs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_ID, and GOOGLE_REFRESH_TOKEN.",
      }),
    ],
  };

  const supabaseSection: AcademySystemSection = {
    title: "Supabase",
    description: "Runtime checks against the Academy tables that recent auth and audit work depend on.",
    checks: await Promise.all([
      runSupabaseTableCheck({
        table: "academy_portal_accounts",
        label: "Portal accounts table",
        successDetail: "academy_portal_accounts is reachable.",
        missingDetail:
          "academy_portal_accounts is not reachable yet. You likely still need to run supabase/migrations/20260506133000_academy_portal_accounts.sql.",
      }),
      runSupabaseTableCheck({
        table: "academy_audit_events",
        label: "Audit events table",
        successDetail: "academy_audit_events is reachable.",
        missingDetail:
          "academy_audit_events is not reachable yet. You likely still need to run supabase/migrations/20260506133000_academy_portal_accounts.sql.",
      }),
      runAdminBootstrapCheck(),
      runSupabaseTableCheck({
        table: "academy_sessions",
        label: "Core session table",
        successDetail: "academy_sessions is reachable.",
        missingDetail: "academy_sessions is not reachable. Core Academy schema may not be applied.",
      }),
      runSupabaseTableCheck({
        table: "academy_email_logs",
        label: "Email log table",
        successDetail: "academy_email_logs is reachable.",
        missingDetail: "academy_email_logs is not reachable. Email workflow logging may be broken.",
      }),
    ]),
  };

  const workflowSection: AcademySystemSection = {
    title: "Pending Work",
    description: "Operational items that still require external setup or unapplied SQL.",
    checks: [
      buildCheck({
        id: "portal-account-sql",
        label: "Portal access migration",
        status: "warning",
        detail:
          "Run supabase/migrations/20260506133000_academy_portal_accounts.sql in any environment that has not received the DB-backed access rollout yet.",
      }),
      buildCheck({
        id: "portal-rls-sql",
        label: "Portal RLS migration",
        status: "warning",
        detail:
          "Run supabase/migrations/20260506143000_academy_portal_rls.sql after the portal accounts migration so parent, tutor, and student reads are protected by database policy.",
      }),
      buildCheck({
        id: "consistency-sql",
        label: "Data consistency migration",
        status: "warning",
        detail:
          "Run supabase/migrations/20260506153000_academy_data_consistency.sql to enforce status checks, duplicate prevention, and relationship guards for sessions, payments, students, and notes.",
      }),
      buildCheck({
        id: "session-revocation-sql",
        label: "Portal session revocation migration",
        status: "warning",
        detail:
          "Run supabase/migrations/20260508173000_academy_portal_session_revocation.sql before using the admin session revocation controls.",
      }),
      buildCheck({
        id: "first-admin-sql",
        label: "First admin bootstrap script",
        status: "warning",
        detail:
          "Run supabase/scripts/bootstrap_academy_admin_access.sql after replacing the placeholder email so the first admin can log in through the new access model.",
      }),
    ],
  };

  return [envSection, supabaseSection, workflowSection];
}
