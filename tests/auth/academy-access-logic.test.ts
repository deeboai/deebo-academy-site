import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAcademyForcedReauthenticationPath,
  buildAcademyLoginPath,
  canAcademyRoleAccessPath,
  decodeJwtIssuedAt,
  getAcademyRedirectPathForRole,
  getLatestForcedReauthenticationAt,
  normalizeAcademyEmail,
  shouldForceReauthentication,
} from "../../src/lib/auth/academy-access-logic.ts";

test("normalizeAcademyEmail trims whitespace and lowercases the address", () => {
  assert.equal(normalizeAcademyEmail("  Parent@Example.COM "), "parent@example.com");
  assert.equal(normalizeAcademyEmail(null), "");
});

test("decodeJwtIssuedAt returns the issued-at timestamp when the token payload includes iat", () => {
  // This mirrors the timestamp shape Supabase includes in the JWT payload.
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iat: 1_715_730_800 })).toString("base64url");
  const token = `${header}.${payload}.signature`;

  assert.equal(decodeJwtIssuedAt(token), "2024-05-14T23:53:20.000Z");
});

test("decodeJwtIssuedAt returns null for invalid or incomplete JWT payloads", () => {
  assert.equal(decodeJwtIssuedAt("invalid"), null);
  assert.equal(decodeJwtIssuedAt("a.b.c"), null);
});

test("getLatestForcedReauthenticationAt returns the most recent force-re-auth timestamp", () => {
  const accounts = [
    { force_reauth_after: "2026-05-01T12:00:00.000Z" },
    { force_reauth_after: null },
    { force_reauth_after: "2026-05-03T09:30:00.000Z" },
  ] as const;

  assert.equal(getLatestForcedReauthenticationAt(accounts as never), "2026-05-03T09:30:00.000Z");
});

test("shouldForceReauthentication requires a fresh sign-in when the session predates the revoke time", () => {
  assert.equal(
    shouldForceReauthentication({
      forcedReauthenticationAt: "2026-05-08T10:00:00.000Z",
      currentSessionIssuedAt: "2026-05-08T09:59:59.000Z",
    }),
    true,
  );
  assert.equal(
    shouldForceReauthentication({
      forcedReauthenticationAt: "2026-05-08T10:00:00.000Z",
      currentSessionIssuedAt: "2026-05-08T10:00:01.000Z",
    }),
    false,
  );
});

test("role path checks only allow the matching protected area", () => {
  assert.equal(canAcademyRoleAccessPath("parent", "/parent"), true);
  assert.equal(canAcademyRoleAccessPath("parent", "/parent/sessions/1"), true);
  assert.equal(canAcademyRoleAccessPath("parent", "/admin"), false);
  assert.equal(canAcademyRoleAccessPath("parent", "https://example.com"), false);
  assert.equal(canAcademyRoleAccessPath("parent", "//evil.example.com"), false);
});

test("getAcademyRedirectPathForRole keeps safe in-scope next paths and falls back otherwise", () => {
  assert.equal(getAcademyRedirectPathForRole("tutor", "/tutor/sessions/abc"), "/tutor/sessions/abc");
  assert.equal(getAcademyRedirectPathForRole("tutor", "/parent"), "/tutor");
});

test("buildAcademyLoginPath only carries safe internal next paths", () => {
  assert.equal(
    buildAcademyLoginPath("Sign in is required.", "/parent/sessions/abc"),
    "/login?error=Sign+in+is+required.&next=%2Fparent%2Fsessions%2Fabc",
  );
  assert.equal(
    buildAcademyLoginPath("Sign in is required.", "https://example.com"),
    "/login?error=Sign+in+is+required.",
  );
});

test("buildAcademyForcedReauthenticationPath only carries safe internal next paths", () => {
  assert.equal(
    buildAcademyForcedReauthenticationPath("/admin/access"),
    "/auth/academy/reauth?next=%2Fadmin%2Faccess",
  );
  assert.equal(buildAcademyForcedReauthenticationPath("//evil.example.com"), "/auth/academy/reauth");
});
