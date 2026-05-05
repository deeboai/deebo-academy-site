export const ACADEMY_INTAKE_STATUSES = [
  "new",
  "reviewing",
  "needs_follow_up",
  "placement_required",
  "approved",
  "rejected",
  "converted",
] as const;

export type AcademyIntakeStatus = (typeof ACADEMY_INTAKE_STATUSES)[number];

export const ACADEMY_INTAKE_STATUS_LABELS: Record<AcademyIntakeStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  needs_follow_up: "Needs Follow-up",
  placement_required: "Placement Required",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted",
};

export function isAcademyIntakeStatus(value: string): value is AcademyIntakeStatus {
  return ACADEMY_INTAKE_STATUSES.includes(value as AcademyIntakeStatus);
}
