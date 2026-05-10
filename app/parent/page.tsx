import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getParentPortalPayments,
  getParentPortalRecordings,
  getParentPortalSessions,
  getParentPortalStudents,
  getParentPortalValidatedSessionNotes,
} from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

function formatMoney(amountCents: number, currency: string) {
  return (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

export default async function ParentHomePage() {
  const { user, parent } = await requireAcademyParentUser();
  const [students, sessions, payments, notes, recordings] = await Promise.all([
    getParentPortalStudents(parent.id),
    getParentPortalSessions(parent.id),
    getParentPortalPayments(parent.id),
    getParentPortalValidatedSessionNotes(parent.id),
    getParentPortalRecordings(parent.id),
  ]);
  const now = new Date();
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const openPayments = payments.filter((payment) => payment.status === "pending" || payment.status === "failed");
  const openBalanceCents = openPayments.reduce((total, payment) => total + payment.amount_cents, 0);
  const activeRecordings = recordings.filter((recording) => {
    return recording.visible_to_parent && new Date(recording.expires_at) > now;
  });
  // Recent session updates prioritize the sessions that already have a validated recap parents can act on.
  const recentRecapSessions = sessions
    .filter((session) => notes.some((note) => note.session_id === session.id))
    .sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime())
    .slice(0, 3);

  return (
    <PortalShell
      title="Parent Portal"
      subtitle="Review upcoming sessions, recap readiness, active recordings, open balances, and the email tied to your Academy access."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SectionCard title="Students">
          <p className="text-3xl font-semibold text-foreground">{students.length}</p>
        </SectionCard>
        <SectionCard title="Upcoming sessions">
          <p className="text-3xl font-semibold text-foreground">{upcomingSessions.length}</p>
        </SectionCard>
        <SectionCard title="Open payments">
          <p className="text-3xl font-semibold text-foreground">{openPayments.length}</p>
        </SectionCard>
        <SectionCard title="Open balance">
          <p className="text-3xl font-semibold text-foreground">
            {formatMoney(openBalanceCents, payments[0]?.currency ?? "usd")}
          </p>
        </SectionCard>
        <SectionCard title="Active recordings">
          <p className="text-3xl font-semibold text-foreground">{activeRecordings.length}</p>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Upcoming actions"
          description="The parent portal should make the next operational step obvious without opening multiple pages."
        >
          <div className="space-y-4">
            {openPayments.length ? (
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="font-medium text-foreground">
                  {openPayments.length} payment {openPayments.length === 1 ? "record is" : "records are"} waiting
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The current open balance is {formatMoney(openBalanceCents, payments[0]?.currency ?? "usd")}.
                </p>
                <Link href="/parent/payments" className="secondary-button mt-4 inline-flex px-4 py-2">
                  Open payments
                </Link>
              </div>
            ) : null}

            {upcomingSessions.length ? (
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="font-medium text-foreground">Next scheduled session</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {upcomingSessions[0]?.subject} · {new Date(upcomingSessions[0].starts_at).toLocaleString()}
                </p>
                <Link
                  href={`/parent/sessions/${upcomingSessions[0]?.id}`}
                  className="secondary-button mt-4 inline-flex px-4 py-2"
                >
                  Open session
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="font-medium text-foreground">No upcoming sessions are scheduled yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Once the Academy team confirms the next session, it will appear here.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Portal access"
          description="This portal still uses the Academy-managed access model, so the signed-in email should stay visible."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Signed-in email: {user.email ?? parent.email}</p>
            <p>Parent contact email: {parent.email}</p>
            <p>Last sign-in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Not available"}</p>
            <p>
              If this access email needs to change, contact Deebo Academy so the parent record and portal access row stay aligned.
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard
          title="Recent session updates"
          description="Validated recaps are the operational record parents should be able to review quickly."
        >
          <div className="space-y-4">
            {recentRecapSessions.length ? (
              recentRecapSessions.map((session) => {
                const note = notes.find((candidate) => candidate.session_id === session.id);
                const recording = recordings.find((candidate) => candidate.session_id === session.id);
                const hasActiveRecording =
                  Boolean(recording?.visible_to_parent) &&
                  Boolean(recording?.expires_at) &&
                  new Date(recording?.expires_at ?? 0) > now;

                return (
                  <article key={session.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{session.subject}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.starts_at).toLocaleString()}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {note?.what_was_covered || "Validated recap available in session detail."}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Recording: {hasActiveRecording ? "Active" : "Not active"}
                        </p>
                      </div>
                      <Link href={`/parent/sessions/${session.id}`} className="secondary-button px-4 py-2">
                        Open recap
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Validated session recaps will appear here once the Academy team reviews submitted notes.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Students at a glance"
          description="Use this to move quickly between each student record and the sessions attached to it."
        >
          <div className="space-y-4">
            {students.map((student) => {
              const studentUpcomingCount = upcomingSessions.filter((session) => session.student_id === student.id).length;

              return (
                <article key={student.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {student.first_name} {student.last_name ?? ""}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{student.grade}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Upcoming sessions: {studentUpcomingCount}
                      </p>
                    </div>
                    <Link href={`/parent/students/${student.id}`} className="secondary-button px-4 py-2">
                      Open
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
