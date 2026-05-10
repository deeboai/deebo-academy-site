import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import { getAcademyDashboardSummary } from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getAcademyWorkflowQueues } from "@/lib/academy-workflow";
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
  const [summary, workflowQueues] = await Promise.all([
    getAcademyDashboardSummary(),
    getAcademyWorkflowQueues(),
  ]);
  const totalWorkflowItems = workflowQueues.reduce((total, queue) => total + queue.items.length, 0);
  const urgentWorkflowQueues = workflowQueues.filter((queue) => queue.items.length).slice(0, 3);

  return (
    <AdminShell
      title="Academy OS"
      subtitle="Operational overview across intake, records, sessions, payments, and session notes."
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
          <p className="text-sm text-muted-foreground">Workflow blockers</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{totalWorkflowItems}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Critical Path"
          description="Use the workflow queue when you need the next action surfaced in order instead of searching by entity type."
        >
          <div className="space-y-4">
            {urgentWorkflowQueues.length ? (
              urgentWorkflowQueues.map((queue) => (
                <div key={queue.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">{queue.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{queue.items.length} item(s) waiting</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {queue.items[0]?.title}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">The critical-path queues are clear right now.</p>
            )}
            <a href="/admin/workflow" className="secondary-button inline-flex px-4 py-2">
              Open workflow queue
            </a>
          </div>
        </SectionCard>

        <SectionCard
          title="Operational direction"
          description="Academy OS now keeps the tutoring workflow inside this repository instead of relying on the broader DeeboAI website admin."
        >
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Review intake first, then convert accepted requests into parent and student records.</li>
            <li>Create tutors, assign them to student-subject records, and schedule sessions from the Academy repo.</li>
            <li>Validate notes, send recaps, and keep parent-facing records aligned with the session lifecycle.</li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Recommended flow"
          description="The workflow page now reflects this path directly, so the operator can run the system from the actual queue instead of memorizing it."
        >
          <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>1. Review new intake requests in the intake queue.</li>
            <li>2. Convert approved requests into parent, student, and subject records.</li>
            <li>3. Assign a tutor, create a session, and track payment and recap follow-through.</li>
          </ol>
        </SectionCard>

        <SectionCard
          title="System checks"
          description="Use the system page before rollout work so env gaps and pending SQL are visible in one place."
        >
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>Open `/admin/system` before rollout changes to verify env wiring and Supabase dependencies.</li>
            <li>Use `/admin/access` after the SQL steps are run to validate invite and disable flows.</li>
            <li>Use `/admin/emails` to review delivery logs, preview templates, and replay supported emails.</li>
            <li>Follow `docs/ACADEMY_OPERATOR_CHECKLIST.md` during production setup.</li>
          </ul>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
