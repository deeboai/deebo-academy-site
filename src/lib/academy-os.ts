export const ACADEMY_SESSION_STATUSES = [
  "draft",
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
  "notes_submitted",
  "notes_validated",
  "recap_sent",
] as const;

export const ACADEMY_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "waived",
] as const;

export const ACADEMY_NOTE_STATUSES = [
  "submitted",
  "needs_revision",
  "validated",
  "emailed",
] as const;

export type AcademySessionStatus = (typeof ACADEMY_SESSION_STATUSES)[number];
export type AcademyPaymentStatus = (typeof ACADEMY_PAYMENT_STATUSES)[number];
export type AcademySessionNoteStatus = (typeof ACADEMY_NOTE_STATUSES)[number];

export const ACADEMY_SESSION_STATUS_LABELS: Record<AcademySessionStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
  rescheduled: "Rescheduled",
  notes_submitted: "Notes Submitted",
  notes_validated: "Notes Validated",
  recap_sent: "Recap Sent",
};

export const ACADEMY_PAYMENT_STATUS_LABELS: Record<AcademyPaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  waived: "Waived",
};

export const ACADEMY_NOTE_STATUS_LABELS: Record<AcademySessionNoteStatus, string> = {
  submitted: "Submitted",
  needs_revision: "Needs Revision",
  validated: "Validated",
  emailed: "Emailed",
};

export function formatAcademyStatusLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isAcademySessionStatus(value: string): value is AcademySessionStatus {
  return ACADEMY_SESSION_STATUSES.includes(value as AcademySessionStatus);
}

export function isAcademyPaymentStatus(value: string): value is AcademyPaymentStatus {
  return ACADEMY_PAYMENT_STATUSES.includes(value as AcademyPaymentStatus);
}

export function isAcademySessionNoteStatus(value: string): value is AcademySessionNoteStatus {
  return ACADEMY_NOTE_STATUSES.includes(value as AcademySessionNoteStatus);
}
