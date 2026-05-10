import type { AcademyPortalAccountRecord } from "../academy-data";

export type AcademyAccessRole = "admin" | "parent" | "tutor" | "student";

export function normalizeAcademyEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function decodeJwtIssuedAt(accessToken: string | null | undefined) {
  if (!accessToken) {
    return null;
  }

  try {
    const payloadSegment = accessToken.split(".")[1];

    if (!payloadSegment) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf-8")) as {
      iat?: number;
    };

    if (!payload.iat) {
      return null;
    }

    return new Date(payload.iat * 1000).toISOString();
  } catch {
    return null;
  }
}

export function getLatestForcedReauthenticationAt(accounts: AcademyPortalAccountRecord[]) {
  const forcedReauthValues = accounts
    .map((account) => account.force_reauth_after)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());

  return forcedReauthValues[0] ?? null;
}

export function shouldForceReauthentication(input: {
  forcedReauthenticationAt: string | null;
  currentSessionIssuedAt: string | null;
}) {
  return Boolean(
    input.forcedReauthenticationAt &&
      (!input.currentSessionIssuedAt ||
        new Date(input.forcedReauthenticationAt).getTime() > new Date(input.currentSessionIssuedAt).getTime()),
  );
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

export function buildAcademyForcedReauthenticationPath(nextPath?: string | null) {
  const params = new URLSearchParams();

  if (nextPath && isSafeInternalPath(nextPath)) {
    params.set("next", nextPath);
  }

  const queryString = params.toString();
  return queryString ? `/auth/academy/reauth?${queryString}` : "/auth/academy/reauth";
}
