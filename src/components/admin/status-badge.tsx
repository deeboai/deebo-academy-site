import {
  type AcademyIntakeStatus,
  ACADEMY_INTAKE_STATUS_LABELS,
} from "@/lib/academy-intake";

type StatusBadgeProps = {
  status: AcademyIntakeStatus;
};

const statusClassNames: Record<AcademyIntakeStatus, string> = {
  new: "border-amber-500/30 bg-amber-500/10 text-foreground",
  reviewing: "border-sky-500/30 bg-sky-500/10 text-foreground",
  needs_follow_up: "border-violet-500/30 bg-violet-500/10 text-foreground",
  placement_required: "border-cyan-500/30 bg-cyan-500/10 text-foreground",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
  rejected: "border-rose-500/30 bg-rose-500/10 text-foreground",
  converted: "border-primary/30 bg-primary/10 text-foreground",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${statusClassNames[status]}`}
    >
      {ACADEMY_INTAKE_STATUS_LABELS[status]}
    </span>
  );
}
