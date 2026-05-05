import Link from "next/link";

import { Search } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  ACADEMY_INTAKE_STATUSES,
  type AcademyIntakeStatus,
  ACADEMY_INTAKE_STATUS_LABELS,
  isAcademyIntakeStatus,
} from "@/lib/academy-intake";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { updateAcademyIntakeStatusAction } from "./actions";

const intakeDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type AdminIntakePageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
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
};

function getSearchValue(
  searchParams: Awaited<AdminIntakePageProps["searchParams"]>,
  key: "q" | "status",
) {
  const rawValue = searchParams?.[key];

  return typeof rawValue === "string" ? rawValue.trim() : "";
}

function buildStatusCounts(submissions: AcademyIntakeSubmission[]) {
  return ACADEMY_INTAKE_STATUSES.map((status) => ({
    status,
    label: ACADEMY_INTAKE_STATUS_LABELS[status],
    count: submissions.filter((submission) => submission.status === status).length,
  }));
}

function matchesIntakeSearch(submission: AcademyIntakeSubmission, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    submission.parent_full_name,
    submission.parent_email,
    submission.parent_phone,
    submission.student_first_name,
    submission.grade,
    submission.subject,
    submission.course_name,
    submission.school_name,
    submission.goals,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function truncateChallenge(value: string) {
  if (value.length <= 180) {
    return value;
  }

  return `${value.slice(0, 177)}...`;
}

function IntakeQuickAction({
  submissionId,
  status,
  label,
}: {
  submissionId: string;
  status: AcademyIntakeStatus;
  label: string;
}) {
  const buttonClassName =
    status === "converted"
      ? "rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      : status === "approved"
        ? "rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20"
        : status === "rejected"
          ? "rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
          : "rounded-xl border border-border/80 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <form action={updateAcademyIntakeStatusAction}>
      <input type="hidden" name="submission_id" value={submissionId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={buttonClassName}>
        {label}
      </button>
    </form>
  );
}

function IntakeSubmissionCard({ submission }: { submission: AcademyIntakeSubmission }) {
  return (
    <article className="record-row">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-xl font-semibold tracking-tight text-foreground">
              {submission.student_first_name}
            </h4>
            <StatusBadge status={submission.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {submission.course_name || submission.subject} · {submission.grade} · Submitted{" "}
            {intakeDateFormatter.format(new Date(submission.created_at))}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <IntakeQuickAction submissionId={submission.id} status="reviewing" label="Mark reviewing" />
          <IntakeQuickAction
            submissionId={submission.id}
            status="needs_follow_up"
            label="Needs follow-up"
          />
          <IntakeQuickAction
            submissionId={submission.id}
            status="placement_required"
            label="Placement required"
          />
          <IntakeQuickAction submissionId={submission.id} status="approved" label="Approve" />
          <IntakeQuickAction submissionId={submission.id} status="rejected" label="Reject" />
          <IntakeQuickAction submissionId={submission.id} status="converted" label="Converted" />
          <Link
            href={`/admin/intake/${submission.id}`}
            className="rounded-xl border border-border/80 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Open details
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
            <p className="record-meta-label">Student</p>
            <p className="mt-2 font-medium text-foreground">{submission.student_first_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{submission.grade}</p>
            {submission.school_name ? (
              <p className="mt-1 text-sm text-muted-foreground">{submission.school_name}</p>
            ) : null}
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
            <p className="record-meta-label">Contact</p>
            <p className="mt-2 font-medium text-foreground">{submission.parent_full_name}</p>
            <a
              href={`mailto:${submission.parent_email}`}
              className="mt-1 block text-sm text-primary hover:underline"
            >
              {submission.parent_email}
            </a>
            <p className="mt-1 text-sm text-muted-foreground">
              {submission.parent_phone || "No phone provided"}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
            <p className="record-meta-label">Course</p>
            <p className="mt-2 font-medium text-foreground">
              {submission.course_name || submission.subject}
            </p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {submission.session_format}
            </p>
            {submission.requested_location ? (
              <p className="mt-1 text-sm text-muted-foreground">{submission.requested_location}</p>
            ) : null}
          </div>

          <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
            <p className="record-meta-label">Scheduling</p>
            <p className="mt-2 text-sm text-foreground">
              {submission.upcoming_deadline || "No deadline provided"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {submission.preferred_availability || "No availability provided"}
            </p>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-border/70 bg-card/70 p-4">
          <p className="record-meta-label">Current challenge</p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {truncateChallenge(submission.goals)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function AcademyAdminIntakePage({
  searchParams,
}: AdminIntakePageProps) {
  const params = (await searchParams) ?? {};
  const statusFilterValue = getSearchValue(params, "status");
  const query = getSearchValue(params, "q");
  const statusFilter = isAcademyIntakeStatus(statusFilterValue) ? statusFilterValue : null;

  const user = await requireAcademyAdminUser();
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase
    .from("academy_intake_submissions")
    .select(
      "id, created_at, updated_at, parent_full_name, parent_email, parent_phone, student_first_name, grade, subject, course_name, school_name, goals, upcoming_deadline, session_format, requested_location, preferred_availability, referral_source, status, placement_required, admin_notes, reviewed_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const submissions = (data ?? []) as AcademyIntakeSubmission[];
  const filteredSubmissions = submissions.filter((submission) => {
    if (statusFilter && submission.status !== statusFilter) {
      return false;
    }

    return matchesIntakeSearch(submission, query);
  });
  const newSubmissions = filteredSubmissions.filter((submission) => submission.status === "new");
  const pipelineSubmissions = filteredSubmissions.filter(
    (submission) => submission.status !== "new",
  );
  const statusCounts = buildStatusCounts(submissions);

  return (
    <AdminShell
      title="Academy intake"
      subtitle="Review fit, track where each tutoring request sits in the pipeline, and keep admin notes attached to the original submission."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="space-y-6">
        <SectionCard
          title="Queue controls"
          description="Search by parent, student, email, subject, or course name. Filter by status when you need to work a specific part of the pipeline."
        >
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Search</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  className="field-input pl-11"
                  placeholder="Search by parent, student, email, subject, or course"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Status</span>
              <select name="status" defaultValue={statusFilterValue} className="field-input">
                <option value="">All statuses</option>
                {ACADEMY_INTAKE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ACADEMY_INTAKE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button type="submit" className="primary-button w-full lg:w-auto">
                Apply
              </button>
              <Link
                href="/admin/intake"
                className="secondary-button w-full justify-center lg:w-auto"
              >
                Reset
              </Link>
            </div>
          </form>
        </SectionCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusCounts.map((item) => (
            <div key={item.status} className="workspace-stat">
              <p className="record-meta-label">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{item.count}</p>
            </div>
          ))}
        </div>

        <SectionCard
          title="New submissions"
          description="Fresh requests stay separate so they can be reviewed quickly before the queue gets crowded."
        >
          {newSubmissions.length ? (
            <div className="space-y-4">
              {newSubmissions.map((submission) => (
                <IntakeSubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No new intake submissions"
              description="New tutoring requests will appear here as soon as they are submitted."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Pipeline submissions"
          description="Reviewing, follow-up, placement, approved, rejected, and converted requests stay together here for operational follow-through."
        >
          {pipelineSubmissions.length ? (
            <div className="space-y-4">
              {pipelineSubmissions.map((submission) => (
                <IntakeSubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pipeline submissions match this view"
              description="Adjust the current search or status filter to see more intake records."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
