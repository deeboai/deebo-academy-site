"use server";

import { redirect } from "next/navigation";

import { getAcademyAdminAccessByEmail, getAcademyAdminRedirectPath } from "@/lib/auth/academy-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { hasPublicSupabaseEnv } from "@/lib/env";

function buildLoginErrorRedirect(message: string, nextPath?: string | null) {
  const params = new URLSearchParams({
    error: message,
  });

  if (nextPath && (nextPath === "/admin" || nextPath.startsWith("/admin/"))) {
    params.set("next", nextPath);
  }

  return `/login?${params.toString()}`;
}

export async function signInAcademyAdminAction(formData: FormData) {
  if (!hasPublicSupabaseEnv) {
    redirect(buildLoginErrorRedirect("Supabase environment variables are not configured."));
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = getAcademyAdminRedirectPath(String(formData.get("next") ?? "").trim());

  if (!email || !password) {
    redirect(buildLoginErrorRedirect("Enter both an email address and password.", nextPath));
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(buildLoginErrorRedirect(error?.message ?? "Unable to sign in.", nextPath));
  }

  let adminAccounts;

  try {
    // Admin access stays database-backed so access can be revoked without changing environment configuration.
    adminAccounts = await getAcademyAdminAccessByEmail(data.user.email);
  } catch (accessError) {
    console.error("Academy admin access bootstrap failed after sign-in", accessError);
    await supabase.auth.signOut();
    redirect(
      buildLoginErrorRedirect(
        "Academy admin access is temporarily unavailable. Please try again shortly.",
        nextPath,
      ),
    );
  }

  if (!adminAccounts.length) {
    await supabase.auth.signOut();
    redirect(
      buildLoginErrorRedirect(
        "This account is not allowed to access the Academy admin.",
        nextPath,
      ),
    );
  }

  const serviceClient = getSupabaseServiceClient() as any;
  await serviceClient
    .from("academy_portal_accounts")
    .update({
      auth_user_id: data.user.id,
      last_login_at: new Date().toISOString(),
      status: "active",
      disabled_at: null,
    })
    .eq("email", email)
    .eq("role", "admin")
    .neq("status", "disabled");

  redirect(nextPath);
}

export async function signOutAcademyUserAction() {
  if (hasPublicSupabaseEnv) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export const signOutAcademyAdminAction = signOutAcademyUserAction;
