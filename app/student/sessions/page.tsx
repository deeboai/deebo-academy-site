import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getStudentPortalSessions,
  getStudentPortalValidatedSessionNotes,
} from "@/lib/academy-portal-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

export default async function StudentSessionsPage() {
  const { user, student } = await requireAcademyStudentUser();
  const [sessions, notes] = await Promise.all([
    getStudentPortalSessions(student.id),
    getStudentPortalValidatedSessionNotes(student.id),
  ]);
  const now = new Date();
  // Split the list so students can distinguish between what is coming next and what is already review material.
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const completedSessions = sessions
    .filter((session) => new Date(session.starts_at) < now)
    .sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime());

  return (
    <PortalShell
      title="Sessions"
      subtitle="Use this page to move between upcoming tutoring work and validated session history."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Upcoming sessions">
          {upcomingSessions.length ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <article key={session.id} className="record-row">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="workspace-eyebrow">Upcoming session</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {session.course_name || "Course name pending"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(session.starts_at).toLocaleString()} · {session.status}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Meeting access: {session.meeting_url ? "Ready" : "Waiting on Academy update"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/student/sessions/${session.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                      {session.meeting_url ? (
                        <a
                          href={session.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="secondary-button px-4 py-2"
                        >
                          Join
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming sessions"
              description="Once the Academy team schedules the next session, it will appear here."
            />
          )}
        </SectionCard>

        <SectionCard title="Session history">
          {completedSessions.length ? (
            <div className="space-y-4">
              {completedSessions.map((session) => {
                const note = notes.find((candidate) => candidate.session_id === session.id);

                return (
                  <article key={session.id} className="record-row">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="workspace-eyebrow">Past session</p>
                        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {session.course_name || "Course name pending"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.starts_at).toLocaleString()} · {session.status}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Recap: {note ? "Validated recap available" : "Waiting on Academy review"}
                        </p>
                      </div>
                      <Link href={`/student/sessions/${session.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No completed sessions yet"
              description="Validated recap history will appear after the first completed tutoring session."
            />
          )}
        </SectionCard>
      </div>

    </PortalShell>
  );
}
