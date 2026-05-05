import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ACADEMY_INTAKE_STATUSES,
  type AcademyIntakeStatus,
  ACADEMY_INTAKE_STATUS_LABELS,
} from "@/lib/academy-intake";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import {
  assignAcademyPlacementAttemptAction,
  convertAcademyIntakeToRecordsAction,
} from "@/actions/academy-os-admin";
import { updateAcademyIntakeNotesAction, updateAcademyIntakeStatusAction } from "../actions";
import { listAcademyParents, listAcademyPlacementExams } from "@/lib/academy-data";

const intakeDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type AdminIntakeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type AcademyIntakeSubmission = {
  id: string;
  created_at: string;
  updated_at: string;
  parent_full_name: string;
  parent_email: string;
  parent_phone: string | null;
  student_first_name: string;
  grade: string;
  subject: string;
  course_name: string | null;
  school_name: string | null;
  goals: string;
  upcoming_deadline: string | null;
  session_format: string;
  requested_location: string | null;
  preferred_availability: string | null;
  referral_source: string | null;
  status: AcademyIntakeStatus;
  placement_required: boolean;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  converted_parent_id: string | null;
  converted_student_id: string | null;
  converted_student_subject_id: string | null;
  accepted_client_agreement: boolean;
  accepted_terms: boolean;
  accepted_privacy: boolean;
};

type AcademyIntakeStatusEvent = {
  id: string;
  previous_status: AcademyIntakeStatus | null;
  next_status: AcademyIntakeStatus;
  changed_by_email: string | null;
  note: string | null;
  created_at: string;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function DetailStatusAction({
  submissionId,
  status,
}: {
  submissionId: string;
  status: AcademyIntakeStatus;
}) {
  return (
    <form action={updateAcademyIntakeStatusAction}>
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-xl border border-border/80 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        {ACADEMY_INTAKE_STATUS_LABELS[status]}
      </button>
    </form>
  );
}

export default async function AcademyAdminIntakeDetailPage({
  params,
}: AdminIntakeDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const supabase = getSupabaseServiceClient() as any;
  const { data: submissionData, error: submissionError } = await supabase
    .from("academy_intake_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (submissionError) {
    throw submissionError;
  }

  const submission = submissionData as AcademyIntakeSubmission | null;

  if (!submission) {
    notFound();
  }

  const { data: eventData, error: eventError } = await supabase
    .from("academy_intake_status_events")
    .select("id, previous_status, next_status, changed_by_email, note, created_at")
    .eq("intake_submission_id", id)
    .order("created_at", { ascending: false });

  if (eventError) {
    throw eventError;
  }

  const statusEvents = (eventData ?? []) as AcademyIntakeStatusEvent[];
  const [placementExams, parents] = await Promise.all([
    listAcademyPlacementExams(),
    listAcademyParents(),
  ]);
  const convertedParent = submission.converted_parent_id
    ? parents.find((candidate) => candidate.id === submission.converted_parent_id) ?? null
    : null;

  return (
    <AdminShell
      title="Intake detail"
      subtitle="Review the full tutoring request, capture admin notes, and move the intake to the right next stage."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin/intake"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to intake queue
          </Link>
          <StatusBadge status={submission.status} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
          <div className="space-y-6">
            <SectionCard
              title={`${submission.student_first_name} · ${submission.course_name || submission.subject}`}
              description={`Submitted ${intakeDateFormatter.format(new Date(submission.created_at))}`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Parent / contact" value={submission.parent_full_name} />
                <DetailRow label="Contact email" value={submission.parent_email} />
                <DetailRow
                  label="Contact phone"
                  value={submission.parent_phone || "No phone number provided"}
                />
                <DetailRow label="Student first name" value={submission.student_first_name} />
                <DetailRow label="Grade / school level" value={submission.grade} />
                <DetailRow label="Subject" value={submission.subject} />
                <DetailRow
                  label="Specific course name"
                  value={submission.course_name || "Course name not provided"}
                />
                <DetailRow
                  label="School name"
                  value={submission.school_name || "School name not provided"}
                />
                <DetailRow
                  label="Upcoming deadline"
                  value={submission.upcoming_deadline || "No deadline provided"}
                />
                <DetailRow
                  label="Best availability"
                  value={submission.preferred_availability || "No availability provided"}
                />
                <DetailRow label="Format" value={submission.session_format} />
                <DetailRow
                  label="Requested location"
                  value={submission.requested_location || "No location provided"}
                />
                <DetailRow
                  label="Referral source"
                  value={submission.referral_source || "No referral source provided"}
                />
                <DetailRow
                  label="Last reviewed"
                  value={
                    submission.reviewed_at
                      ? intakeDateFormatter.format(new Date(submission.reviewed_at))
                      : "Not reviewed yet"
                  }
                />
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Current challenge
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {submission.goals}
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="Status history"
              description="Every intake status change is recorded here so the review trail stays visible."
            >
              {statusEvents.length ? (
                <div className="space-y-4">
                  {statusEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-border/70 bg-background/50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={event.next_status} />
                        <p className="text-sm text-muted-foreground">
                          {intakeDateFormatter.format(new Date(event.created_at))}
                        </p>
                      </div>
                      <p className="mt-3 text-sm text-foreground">
                        {event.previous_status
                          ? `${ACADEMY_INTAKE_STATUS_LABELS[event.previous_status]} → ${ACADEMY_INTAKE_STATUS_LABELS[event.next_status]}`
                          : `Set to ${ACADEMY_INTAKE_STATUS_LABELS[event.next_status]}`}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {event.changed_by_email || "Admin account"}
                      </p>
                      {event.note ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {event.note}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No status history yet"
                  description="Status events will appear here after the first intake decision is recorded."
                />
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Admin actions"
              description="Use these controls to move the intake through the Academy review pipeline."
            >
              <div className="flex flex-wrap gap-3">
                {ACADEMY_INTAKE_STATUSES.map((status) => (
                  <DetailStatusAction key={status} submissionId={submission.id} status={status} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Convert to records"
              description="Create the parent, student, and student-subject records directly from this intake once the request is approved."
            >
              <form action={convertAcademyIntakeToRecordsAction} className="space-y-4">
                <input type="hidden" name="submission_id" value={submission.id} />
                <div>
                  <label className="field-label">Student last name</label>
                  <input name="student_last_name" className="field-input" />
                </div>
                <div>
                  <label className="field-label">Subject level</label>
                  <input
                    name="subject_level"
                    className="field-input"
                    placeholder="Precalculus honors, middle school algebra, AP level, etc."
                  />
                </div>
                <button type="submit" className="primary-button w-full justify-center">
                  Convert to parent and student records
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Assign placement exam"
              description="Placement assignment stays attached to the intake review workflow when an extra fit check is needed."
            >
              <form action={assignAcademyPlacementAttemptAction} className="space-y-4">
                <input type="hidden" name="intake_id" value={submission.id} />
                <input type="hidden" name="parent_id" value={convertedParent?.id ?? ""} />
                <div>
                  <label className="field-label">Placement exam</label>
                  <select name="exam_id" className="field-input">
                    {placementExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-muted-foreground">
                  This uses the converted parent record when one exists. If the intake has not been converted yet, assign from the placement admin page after conversion.
                </p>
                <button
                  type="submit"
                  className="secondary-button w-full justify-center"
                  disabled={!convertedParent}
                >
                  Assign placement attempt
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Admin notes"
              description="Record fit observations, follow-up needs, or internal context without changing the original intake text."
            >
              <form action={updateAcademyIntakeNotesAction} className="space-y-4">
                <input type="hidden" name="submission_id" value={submission.id} />
                <textarea
                  name="admin_notes"
                  rows={10}
                  defaultValue={submission.admin_notes ?? ""}
                  className="field-input"
                  placeholder="Internal notes about fit, placement needs, scheduling concerns, follow-up steps, or conversion context."
                />
                <button type="submit" className="primary-button w-full justify-center">
                  Save admin notes
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Legal acceptance"
              description="These checkboxes confirm the booking contact accepted the required Academy documents when the intake was submitted."
            >
              <div className="space-y-3 text-sm text-foreground">
                <p>
                  Client Agreement:{" "}
                  {submission.accepted_client_agreement ? "Accepted" : "Not accepted"}
                </p>
                <p>Terms: {submission.accepted_terms ? "Accepted" : "Not accepted"}</p>
                <p>Privacy: {submission.accepted_privacy ? "Accepted" : "Not accepted"}</p>
                <p>
                  Placement required flag:{" "}
                  {submission.placement_required ? "Yes" : "No"}
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
