import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  getAcademyParentByEmail,
  getAcademyStudentUserByEmail,
  getAcademyTutorByEmail,
} from "@/lib/academy-data";
import { env, hasPublicSupabaseEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AcademyAccessRole = "admin" | "parent" | "tutor" | "student";

export type AcademyResolvedAccess =
  | {
      role: "admin";
      redirectPath: "/admin";
    }
  | {
      role: "parent";
      redirectPath: "/parent";
      parentId: string;
    }
  | {
      role: "tutor";
      redirectPath: "/tutor";
      tutorId: string;
    }
  | {
      role: "student";
      redirectPath: "/student";
      studentId: string;
      studentUserId: string;
    };

type AcademyResolvedAccessState = {
  user: User;
  accesses: AcademyResolvedAccess[];
};

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

// The login router uses a single email lookup path so every portal can share one sign-in screen.
export function isAcademyAdminEmail(email: string | null | undefined) {
  if (!env.academyAdminEmails.length) {
    return false;
  }

  return env.academyAdminEmails.includes(normalizeEmail(email));
}

export async function getOptionalAuthenticatedAcademyUser() {
  if (!hasPublicSupabaseEnv) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuthenticatedAcademyUser(nextPath?: string): Promise<User> {
  const user = await getOptionalAuthenticatedAcademyUser();

  if (!user) {
    redirect(buildAcademyLoginPath("Sign in is required.", nextPath));
  }

  return user;
}

export async function resolveAcademyAccessByEmail(email: string | null | undefined) {
  const accesses = await resolveAcademyAccessOptionsByEmail(email);
  return accesses[0] ?? null;
}

export async function resolveAcademyAccessOptionsByEmail(email: string | null | undefined) {
  if (!hasPublicSupabaseEnv) {
    return [] as AcademyResolvedAccess[];
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return [] as AcademyResolvedAccess[];
  }

  const accessOptions: AcademyResolvedAccess[] = [];

  if (env.academyAdminEmails.length > 0 && isAcademyAdminEmail(normalizedEmail)) {
    accessOptions.push({
      role: "admin",
      redirectPath: "/admin",
    } satisfies AcademyResolvedAccess);
  }

  const [parent, tutor, studentUser] = await Promise.all([
    getAcademyParentByEmail(normalizedEmail),
    getAcademyTutorByEmail(normalizedEmail),
    getAcademyStudentUserByEmail(normalizedEmail),
  ]);

  if (parent) {
    accessOptions.push({
      role: "parent",
      redirectPath: "/parent",
      parentId: parent.id,
    } satisfies AcademyResolvedAccess);
  }

  if (tutor) {
    accessOptions.push({
      role: "tutor",
      redirectPath: "/tutor",
      tutorId: tutor.id,
    } satisfies AcademyResolvedAccess);
  }

  if (studentUser) {
    accessOptions.push({
      role: "student",
      redirectPath: "/student",
      studentId: studentUser.student_id,
      studentUserId: studentUser.id,
    } satisfies AcademyResolvedAccess);
  }

  return accessOptions;
}

export async function getOptionalAcademyAccessForCurrentUser() {
  const user = await getOptionalAuthenticatedAcademyUser();

  if (!user?.email) {
    return null;
  }

  const accesses = await resolveAcademyAccessOptionsByEmail(user.email);

  if (!accesses.length) {
    return null;
  }

  return {
    user,
    accesses,
  } satisfies AcademyResolvedAccessState;
}

function isSafeInternalPath(pathname: string) {
  return pathname.startsWith("/") && !pathname.startsWith("//");
}

export function getAcademyHomePathForRole(role: AcademyAccessRole) {
  switch (role) {
    case "admin":
      return "/admin";
    case "parent":
      return "/parent";
    case "tutor":
      return "/tutor";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}

export function canAcademyRoleAccessPath(role: AcademyAccessRole, pathname: string) {
  if (!isSafeInternalPath(pathname)) {
    return false;
  }

  switch (role) {
    case "admin":
      return pathname === "/admin" || pathname.startsWith("/admin/");
    case "parent":
      return pathname === "/parent" || pathname.startsWith("/parent/");
    case "tutor":
      return pathname === "/tutor" || pathname.startsWith("/tutor/");
    case "student":
      return pathname === "/student" || pathname.startsWith("/student/");
    default:
      return false;
  }
}

export function getAcademyRedirectPathForRole(role: AcademyAccessRole, requestedPath?: string | null) {
  if (requestedPath && canAcademyRoleAccessPath(role, requestedPath)) {
    return requestedPath;
  }

  return getAcademyHomePathForRole(role);
}

export function buildAcademyLoginPath(error?: string, nextPath?: string | null) {
  const params = new URLSearchParams();

  if (error) {
    params.set("error", error);
  }

  if (nextPath && isSafeInternalPath(nextPath)) {
    params.set("next", nextPath);
  }

  const queryString = params.toString();
  return queryString ? `/login?${queryString}` : "/login";
}

export function getAcademyRoleLabel(role: AcademyAccessRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "parent":
      return "Parent";
    case "tutor":
      return "Tutor";
    case "student":
      return "Student";
    default:
      return "Portal";
  }
}
