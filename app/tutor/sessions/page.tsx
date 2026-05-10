import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getTutorPortalSessionNotes, getTutorPortalSessions } from "@/lib/academy-portal-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

export default async function TutorSessionsPage() {
  const { user, tutor } = await requireAcademyTutorUser();
  const [sessions, notes] = await Promise.all([
    getTutorPortalSessions(tutor.id),
    getTutorPortalSessionNotes(tutor.id),
  ]);
  const now = new Date();
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const recentSessions = sessions
    .filter((session) => new Date(session.starts_at) < now)
    .sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime());

  return (
    <PortalShell
      title="Tutor Sessions"
      subtitle="Upcoming sessions, recent teaching history, and note revision state stay grouped here."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/students", label: "Students" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Upcoming sessions"
          description="These are the sessions that still need teaching prep, attendance, or note submission."
        >
          <div className="space-y-4">
            {upcomingSessions.length ? (
              upcomingSessions.map((session) => {
                const note = notes.find((candidate) => candidate.session_id === session.id);

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
                          Note status: {note?.admin_status || "Not started"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/tutor/sessions/${session.id}`} className="secondary-button px-4 py-2">
                          Open
                        </Link>
                        <Link href={`/tutor/sessions/${session.id}/notes`} className="secondary-button px-4 py-2">
                          Notes
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions are assigned right now.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent sessions"
          description="Recent work stays visible here together with revision and validation status."
        >
          <div className="space-y-4">
            {recentSessions.length ? (
              recentSessions.map((session) => {
                const note = notes.find((candidate) => candidate.session_id === session.id);

                return (
                  <article key={session.id} className="record-row">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="workspace-eyebrow">Recent</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {session.course_name || "Course name pending"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.starts_at).toLocaleString()}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Note status: {note?.admin_status || "Not started"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/tutor/sessions/${session.id}`} className="secondary-button px-4 py-2">
                          Open
                        </Link>
                        <Link href={`/tutor/sessions/${session.id}/notes`} className="secondary-button px-4 py-2">
                          Notes
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Completed sessions will appear here after tutoring begins.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
