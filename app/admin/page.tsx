import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import { getAcademyDashboardSummary } from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  buildAcademyLoginPath,
  getAcademyRedirectPathForRole,
  getOptionalAcademyAccessForCurrentUser,
} from "@/lib/auth/academy-access";

export default async function AcademyAdminEntryPage() {
  const currentAccess = await getOptionalAcademyAccessForCurrentUser();

  if (!currentAccess) {
    redirect(buildAcademyLoginPath(undefined, "/admin"));
  }

  const adminAccess = currentAccess.accesses.find((access) => access.role === "admin");

  if (!adminAccess) {
    redirect(getAcademyRedirectPathForRole(currentAccess.accesses[0].role));
  }

  const adminUser = await requireAcademyAdminUser();
  const summary = await getAcademyDashboardSummary();

  return (
    <AdminShell
      title="Academy OS"
      subtitle="Operational overview across intake, records, sessions, payments, notes, and placement."
      userEmail={adminUser.email ?? "Authenticated user"}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Intakes</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.intakes}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Parents</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.parents}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Students</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.students}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Tutors</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.tutors}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Scheduled sessions</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.scheduledSessions}
          </p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Pending payments</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.pendingPayments}
          </p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Submitted notes</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.submittedNotes}</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/90 p-5">
          <p className="text-sm text-muted-foreground">Active placement attempts</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.activePlacementAttempts}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Operational direction"
          description="Academy OS now keeps the tutoring workflow inside this repository instead of relying on the broader DeeboAI website admin."
        >
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Review intake first, then convert accepted requests into parent and student records.</li>
            <li>Create tutors, assign them to student-subject records, and schedule sessions from the Academy repo.</li>
            <li>Validate notes, send recaps, track placement, and keep parent-facing records aligned with the session lifecycle.</li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Recommended flow"
          description="The cleanest path through the system still starts with intake and then moves into the operational records."
        >
          <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>1. Review new intake requests in the intake queue.</li>
            <li>2. Convert approved requests into parent, student, and subject records.</li>
            <li>3. Assign a tutor, create a session, and track payment and recap follow-through.</li>
          </ol>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
