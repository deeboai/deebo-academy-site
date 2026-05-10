import assert from "node:assert/strict";
import test from "node:test";

import {
  canSendAcademySessionRecap,
  getDefaultAcademyAdminReviewStatus,
} from "../../src/lib/academy-session-notes.ts";

test("getDefaultAcademyAdminReviewStatus converts emailed notes back to validated for admin review forms", () => {
  assert.equal(getDefaultAcademyAdminReviewStatus("emailed"), "validated");
  assert.equal(getDefaultAcademyAdminReviewStatus("needs_revision"), "needs_revision");
});

test("canSendAcademySessionRecap only allows validated or already-emailed notes", () => {
  assert.equal(canSendAcademySessionRecap("submitted"), false);
  assert.equal(canSendAcademySessionRecap("needs_revision"), false);
  assert.equal(canSendAcademySessionRecap("validated"), true);
  assert.equal(canSendAcademySessionRecap("emailed"), true);
});
