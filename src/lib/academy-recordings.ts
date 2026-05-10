import type { AcademyRecordingRecord } from "./academy-data";

export function isParentVisibleRecordingActive(recording: AcademyRecordingRecord | null | undefined) {
  if (!recording) {
    return false;
  }

  return recording.visible_to_parent && new Date(recording.expires_at) > new Date();
}

export function buildParentRecordingAccessPath(sessionId: string) {
  return `/parent/sessions/${sessionId}/recording`;
}

export function buildAdminRecordingAccessPath(sessionId: string) {
  return `/admin/sessions/${sessionId}/recording`;
}

export function getRecordingAvailabilityState(recording: AcademyRecordingRecord | null | undefined) {
  if (!recording) {
    return "missing";
  }

  if (!recording.visible_to_parent) {
    return "hidden";
  }

  if (new Date(recording.expires_at) <= new Date()) {
    return "expired";
  }

  return "active";
}

export function getExtendedRecordingExpiryIso(
  currentExpiresAt: string,
  extensionDays: number,
  currentTime = new Date(),
) {
  const currentExpiry = new Date(currentExpiresAt);
  // Extend from the later of now or the existing expiry so admins do not accidentally shorten the window.
  const baseTime =
    Number.isNaN(currentExpiry.getTime()) || currentExpiry < currentTime ? currentTime : currentExpiry;

  const extendedExpiry = new Date(baseTime);
  extendedExpiry.setDate(extendedExpiry.getDate() + extensionDays);
  return extendedExpiry.toISOString();
}
