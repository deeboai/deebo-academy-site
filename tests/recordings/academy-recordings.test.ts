import assert from "node:assert/strict";
import test from "node:test";

import {
  getExtendedRecordingExpiryIso,
  getRecordingAvailabilityState,
  isParentVisibleRecordingActive,
} from "../../src/lib/academy-recordings.ts";

test("isParentVisibleRecordingActive only returns true when the recording is visible and unexpired", () => {
  assert.equal(
    isParentVisibleRecordingActive({
      visible_to_parent: true,
      expires_at: "2099-01-01T00:00:00.000Z",
    } as never),
    true,
  );
  assert.equal(
    isParentVisibleRecordingActive({
      visible_to_parent: false,
      expires_at: "2099-01-01T00:00:00.000Z",
    } as never),
    false,
  );
  assert.equal(
    isParentVisibleRecordingActive({
      visible_to_parent: true,
      expires_at: "2000-01-01T00:00:00.000Z",
    } as never),
    false,
  );
});

test("getRecordingAvailabilityState distinguishes missing, hidden, expired, and active recordings", () => {
  assert.equal(getRecordingAvailabilityState(null), "missing");
  assert.equal(
    getRecordingAvailabilityState({
      visible_to_parent: false,
      expires_at: "2099-01-01T00:00:00.000Z",
    } as never),
    "hidden",
  );
  assert.equal(
    getRecordingAvailabilityState({
      visible_to_parent: true,
      expires_at: "2000-01-01T00:00:00.000Z",
    } as never),
    "expired",
  );
  assert.equal(
    getRecordingAvailabilityState({
      visible_to_parent: true,
      expires_at: "2099-01-01T00:00:00.000Z",
    } as never),
    "active",
  );
});

test("getExtendedRecordingExpiryIso extends from the current expiry when it is still in the future", () => {
  const now = new Date("2026-05-08T12:00:00.000Z");

  assert.equal(
    getExtendedRecordingExpiryIso("2026-05-10T12:00:00.000Z", 7, now),
    "2026-05-17T12:00:00.000Z",
  );
});

test("getExtendedRecordingExpiryIso extends from now when the current expiry is already past", () => {
  const now = new Date("2026-05-08T12:00:00.000Z");

  assert.equal(
    getExtendedRecordingExpiryIso("2026-05-01T12:00:00.000Z", 7, now),
    "2026-05-15T12:00:00.000Z",
  );
});
