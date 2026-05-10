import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getParentPortalPayments,
  getParentPortalRecordings,
  getParentPortalSessions,
  getParentPortalValidatedSessionNotes,
} from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

export default async function ParentSessionsPage() {
  const { user, parent } = await requireAcademyParentUser();
  const [sessions, payments, notes, recordings] = await Promise.all([
    getParentPortalSessions(parent.id),
    getParentPortalPayments(parent.id),
    getParentPortalValidatedSessionNotes(parent.id),
    getParentPortalRecordings(parent.id),
  ]);
  const now = new Date();
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const sessionHistory = sessions
    .filter((session) => new Date(session.starts_at) < now)
    .sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime());

  return (
    <PortalShell
      title="Sessions"
      subtitle="Upcoming sessions, payment state, recap readiness, and recording access are grouped here so the next step is visible."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Upcoming sessions"
          description="These are the sessions that still need attendance, payment follow-through, or recap review."
        >
          <div className="space-y-4">
            {upcomingSessions.length ? (
              upcomingSessions.map((session) => {
                const payment = payments.find((candidate) => candidate.session_id === session.id);

                return (
                  <article key={session.id} className="record-row">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="workspace-eyebrow">Upcoming</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {session.course_name || "Course name pending"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.starts_at).toLocaleString()}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Payment status: {payment?.status ?? session.payment_status}
                        </p>
                      </div>
                      <Link href={`/parent/sessions/${session.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions are scheduled yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Session history"
          description="Completed sessions surface recap and recording availability alongside the historical record."
        >
          <div className="space-y-4">
            {sessionHistory.length ? (
              sessionHistory.map((session) => {
                const note = notes.find((candidate) => candidate.session_id === session.id);
                const recording = recordings.find((candidate) => candidate.session_id === session.id);
                const activeRecording =
                  Boolean(recording?.visible_to_parent) &&
                  Boolean(recording?.expires_at) &&
                  new Date(recording?.expires_at ?? 0) > now;

                return (
                  <article key={session.id} className="record-row">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="workspace-eyebrow">History</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {session.course_name || "Course name pending"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.starts_at).toLocaleString()}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Recap: {note ? "Validated" : "Not available yet"} · Recording: {activeRecording ? "Active" : "Not active"}
                        </p>
                      </div>
                      <Link href={`/parent/sessions/${session.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Completed sessions will appear here once tutoring begins.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
