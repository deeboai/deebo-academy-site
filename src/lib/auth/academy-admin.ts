import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  buildAcademyLoginPath,
  getOptionalAuthenticatedAcademyUser,
  isAcademyAdminEmail,
} from "@/lib/auth/academy-access";

export async function getOptionalAcademyAdminUser() {
  return getOptionalAuthenticatedAcademyUser();
}

export async function requireAcademyAdminUser(): Promise<User> {
  const user = await getOptionalAcademyAdminUser();

  if (!user) {
    redirect(buildAcademyLoginPath("Sign in is required.", "/admin"));
  }

  if (!isAcademyAdminEmail(user.email)) {
    redirect(
      buildAcademyLoginPath("This account is not allowed to access the Academy admin.", "/admin"),
    );
  }

  return user;
}
