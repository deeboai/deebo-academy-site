import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  getAcademyPortalAccountsByEmail,
  type AcademyPortalAccountRecord,
} from "@/lib/academy-data";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function isSafeAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function buildAcademyLoginPath(error?: string, nextPath?: string | null) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  if (nextPath && isSafeAdminPath(nextPath)) {
    params.set("next", nextPath);
  }

  const queryString = params.toString();
  return queryString ? `/login?${queryString}` : "/login";
}

export function getAcademyAdminRedirectPath(requestedPath?: string | null) {
  if (requestedPath && isSafeAdminPath(requestedPath)) {
    return requestedPath;
  }

  return "/admin";
}

export async function getOptionalAuthenticatedAcademyUser(): Promise<User | null> {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getAcademyAdminAccessByEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  if (!normalizedEmail) {
    return [] as AcademyPortalAccountRecord[];
  }

  const accounts = await getAcademyPortalAccountsByEmail(normalizedEmail);

  return accounts.filter((account) => account.role === "admin" && account.status !== "disabled");
}

export async function getOptionalAcademyAdminAccessForCurrentUser() {
  const user = await getOptionalAuthenticatedAcademyUser();

  if (!user?.email) {
    return [] as AcademyPortalAccountRecord[];
  }

  try {
    return await getAcademyAdminAccessByEmail(user.email);
  } catch (error) {
    console.error("Academy admin access lookup failed for the current user", error);
    return [] as AcademyPortalAccountRecord[];
  }
}
