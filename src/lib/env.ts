const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const resendApiKey = process.env.RESEND_API_KEY ?? "";
const academyFromEmail = process.env.ACADEMY_FROM_EMAIL ?? "";
const academyNotificationEmail = process.env.ACADEMY_NOTIFICATION_EMAIL ?? "";

export const env = {
  publicSupabaseUrl,
  publicSupabaseAnonKey,
  serviceRoleKey,
  resendApiKey,
  academyFromEmail,
  academyNotificationEmail,
};

export const hasPublicSupabaseEnv = Boolean(publicSupabaseUrl && publicSupabaseAnonKey);
export const hasServiceRoleKey = Boolean(serviceRoleKey);
export const hasAcademyEmailEnv = Boolean(resendApiKey && academyFromEmail);

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
