"use server";

import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { hasPublicSupabaseEnv } from "@/lib/env";
import {
  getAcademyRedirectPathForRole,
  resolveAcademyAccessOptionsByEmail,
} from "@/lib/auth/academy-access";

function buildLoginErrorRedirect(message: string, nextPath?: string | null) {
  const params = new URLSearchParams({
    error: message,
  });

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    params.set("next", nextPath);
  }

  return `/login?${params.toString()}`;
}

export async function signInAcademyUserAction(formData: FormData) {
  if (!hasPublicSupabaseEnv) {
    redirect(buildLoginErrorRedirect("Supabase environment variables are not configured."));
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "").trim();

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

  const accesses = await resolveAcademyAccessOptionsByEmail(data.user.email);

  if (!accesses.length) {
    await supabase.auth.signOut();
    redirect(
      buildLoginErrorRedirect(
        "This account does not yet have Academy portal access. Link it to an admin, parent, tutor, or student record first.",
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
    .neq("status", "disabled");

  if (nextPath) {
    const matchingAccess = accesses.find((access) =>
      getAcademyRedirectPathForRole(access.role, nextPath) === nextPath,
    );

    if (matchingAccess) {
      redirect(nextPath);
    }
  }

  if (accesses.length === 1) {
    redirect(getAcademyRedirectPathForRole(accesses[0].role, nextPath));
  }

  const params = new URLSearchParams();

  if (nextPath?.startsWith("/") && !nextPath.startsWith("//")) {
    params.set("next", nextPath);
  }

  redirect(params.toString() ? `/login?${params.toString()}` : "/login");
}

export async function signInAcademyAdminAction(formData: FormData) {
  const nextFormData = new FormData();
  nextFormData.set("email", String(formData.get("email") ?? ""));
  nextFormData.set("password", String(formData.get("password") ?? ""));
  nextFormData.set("next", "/admin");

  return signInAcademyUserAction(nextFormData);
}

export async function signOutAcademyUserAction() {
  if (hasPublicSupabaseEnv) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export const signOutAcademyAdminAction = signOutAcademyUserAction;
