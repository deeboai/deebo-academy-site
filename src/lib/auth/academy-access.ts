import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  getAcademyPortalAccountsByEmail,
  type AcademyPortalAccountRecord,
} from "@/lib/academy-data";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildAcademyForcedReauthenticationPath,
  buildAcademyLoginPath,
  canAcademyRoleAccessPath,
  decodeJwtIssuedAt,
  getAcademyHomePathForRole,
  getAcademyRedirectPathForRole,
  getLatestForcedReauthenticationAt,
  normalizeAcademyEmail,
  shouldForceReauthentication,
  type AcademyAccessRole,
} from "./academy-access-logic";

export type AcademyResolvedAccess =
  | {
      role: "admin";
      redirectPath: "/admin";
    }
  | {
      role: "parent";
      redirectPath: "/parent";
      parentId: string;
      accountId: string;
    }
  | {
      role: "tutor";
      redirectPath: "/tutor";
      tutorId: string;
      accountId: string;
    }
  | {
      role: "student";
      redirectPath: "/student";
      studentId: string;
      accountId: string;
    };

type AcademyResolvedAccessState = {
  user: User;
  accesses: AcademyResolvedAccess[];
  requiresReauthentication: boolean;
  forcedReauthenticationAt: string | null;
};

function buildAccessesFromPortalAccounts(accounts: AcademyPortalAccountRecord[]) {
  return accounts
    .filter((account) => account.status !== "disabled")
    .flatMap((account): AcademyResolvedAccess[] => {
      switch (account.role) {
        case "admin":
          return [
            {
              role: "admin",
              redirectPath: "/admin",
            },
          ];
        case "parent":
          return account.parent_id
            ? [
                {
                  role: "parent",
                  redirectPath: "/parent",
                  parentId: account.parent_id,
                  accountId: account.id,
                },
              ]
            : [];
        case "tutor":
          return account.tutor_id
            ? [
                {
                  role: "tutor",
                  redirectPath: "/tutor",
                  tutorId: account.tutor_id,
                  accountId: account.id,
                },
              ]
            : [];
        case "student":
          return account.student_id
            ? [
                {
                  role: "student",
                  redirectPath: "/student",
                  studentId: account.student_id,
                  accountId: account.id,
                },
              ]
            : [];
        default:
          return [];
      }
    });
}

async function resolveAcademyAccessStateForUser(user: User) {
  if (!user.email) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accounts = await getAcademyPortalAccountsByEmail(user.email);
  const accesses = buildAccessesFromPortalAccounts(accounts);

  if (!accesses.length) {
    return null;
  }

  const forcedReauthenticationAt = getLatestForcedReauthenticationAt(accounts);
  const currentSessionIssuedAt = decodeJwtIssuedAt(session?.access_token);
  const requiresReauthentication = shouldForceReauthentication({
    forcedReauthenticationAt,
    currentSessionIssuedAt,
  });

  return {
    user,
    accesses,
    requiresReauthentication,
    forcedReauthenticationAt,
  } satisfies AcademyResolvedAccessState;
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

  const accessState = await resolveAcademyAccessStateForUser(user);

  if (accessState?.requiresReauthentication) {
    redirect(buildAcademyForcedReauthenticationPath(nextPath));
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

  const normalizedEmail = normalizeAcademyEmail(email);

  if (!normalizedEmail) {
    return [] as AcademyResolvedAccess[];
  }

  // Portal authorization is stored in the database so roles can be managed from the admin UI.
  const accounts = await getAcademyPortalAccountsByEmail(normalizedEmail);
  return buildAccessesFromPortalAccounts(accounts);
}

export async function getOptionalAcademyAccessForCurrentUser() {
  const user = await getOptionalAuthenticatedAcademyUser();

  if (!user?.email) {
    return null;
  }

  return resolveAcademyAccessStateForUser(user);
}

export {
  buildAcademyForcedReauthenticationPath,
  buildAcademyLoginPath,
  canAcademyRoleAccessPath,
  getAcademyHomePathForRole,
  getAcademyRedirectPathForRole,
};

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
