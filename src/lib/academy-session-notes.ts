import type { AcademySessionNoteStatus } from "./academy-os";

export function getDefaultAcademyAdminReviewStatus(status: AcademySessionNoteStatus) {
  return status === "emailed" ? "validated" : status;
}

export function canSendAcademySessionRecap(status: AcademySessionNoteStatus) {
  return status === "validated" || status === "emailed";
}
