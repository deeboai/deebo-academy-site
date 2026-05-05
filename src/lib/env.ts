const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const resendApiKey = process.env.RESEND_API_KEY ?? "";
const academyFromEmail = process.env.ACADEMY_FROM_EMAIL ?? "";
const academyNotificationEmail = process.env.ACADEMY_NOTIFICATION_EMAIL ?? "";
const academyAdminEmailsRaw = process.env.ACADEMY_ADMIN_EMAILS ?? "";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const publicStripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
const googleCalendarId = process.env.GOOGLE_CALENDAR_ID ?? "";
const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
const academyAdminEmails = academyAdminEmailsRaw
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const env = {
  publicSupabaseUrl,
  publicSupabaseAnonKey,
  serviceRoleKey,
  resendApiKey,
  academyFromEmail,
  academyNotificationEmail,
  academyAdminEmails,
  stripeSecretKey,
  stripeWebhookSecret,
  publicStripePublishableKey,
  googleClientId,
  googleClientSecret,
  googleCalendarId,
  openAiApiKey,
};

export const hasPublicSupabaseEnv = Boolean(publicSupabaseUrl && publicSupabaseAnonKey);
export const hasServiceRoleKey = Boolean(serviceRoleKey);
export const hasAcademyEmailEnv = Boolean(resendApiKey && academyFromEmail);
export const hasAcademyAdminEmails = academyAdminEmails.length > 0;

export function assertPublicSupabaseEnv() {
  if (!hasPublicSupabaseEnv) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them before using the Academy intake flow.",
    );
  }
}

export function assertAcademyEmailEnv() {
  if (!hasAcademyEmailEnv) {
    throw new Error(
      "Missing RESEND_API_KEY or ACADEMY_FROM_EMAIL. Set them before sending Academy intake emails.",
    );
  }
}

export function assertServiceRoleKey() {
  if (!hasServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Set it before enabling signed testimonial video uploads.",
    );
  }
}

export function assertAcademyAdminEmails() {
  if (!hasAcademyAdminEmails) {
    throw new Error(
      "Missing ACADEMY_ADMIN_EMAILS. Add one or more comma-separated admin email addresses before enabling the Academy admin.",
    );
  }
}
