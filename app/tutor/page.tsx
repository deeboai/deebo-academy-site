import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getTutorPortalSessionNotes,
  getTutorPortalSessions,
  getTutorPortalStudents,
} from "@/lib/academy-portal-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

export default async function TutorHomePage() {
  const { user, tutor } = await requireAcademyTutorUser();
  const [sessions, notes, students] = await Promise.all([
    getTutorPortalSessions(tutor.id),
    getTutorPortalSessionNotes(tutor.id),
    getTutorPortalStudents(tutor.id),
  ]);
  const now = new Date();
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const needsRevisionNotes = notes.filter((note) => note.admin_status === "needs_revision");
  const submittedNotes = notes.filter((note) => note.admin_status === "submitted");
  const recentRevisionSession = needsRevisionNotes
    .map((note) => sessions.find((session) => session.id === note.session_id))
    .find(Boolean) ?? null;

  return (
    <PortalShell
      title="Tutor Portal"
      subtitle="Track upcoming teaching work, revision requests, student load, and curriculum resources from one workspace."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/students", label: "Students" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Upcoming sessions">
          <p className="text-3xl font-semibold text-foreground">{upcomingSessions.length}</p>
        </SectionCard>
        <SectionCard title="Students">
          <p className="text-3xl font-semibold text-foreground">{students.length}</p>
        </SectionCard>
        <SectionCard title="Submitted notes">
          <p className="text-3xl font-semibold text-foreground">{submittedNotes.length}</p>
        </SectionCard>
        <SectionCard title="Needs revision">
          <p className="text-3xl font-semibold text-foreground">{needsRevisionNotes.length}</p>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionCard
          title="Upcoming workload"
          description="This should make the next tutoring action obvious without forcing the tutor through the admin workflow."
        >
          <div className="space-y-4">
            {upcomingSessions.length ? (
              upcomingSessions.slice(0, 5).map((session) => (
                <article key={session.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{session.subject}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {session.course_name || "Course name pending"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {new Date(session.starts_at).toLocaleString()}
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
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming sessions are assigned right now.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Revision queue"
          description="When an admin requests changes, the tutor should see that queue immediately together with the session that needs attention."
        >
          <div className="space-y-4">
            {needsRevisionNotes.length ? (
              needsRevisionNotes.slice(0, 5).map((note) => {
                const session = sessions.find((candidate) => candidate.id === note.session_id);

                return (
                  <article key={note.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="font-semibold text-foreground">
                      {session?.subject || "Session pending"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session ? new Date(session.starts_at).toLocaleString() : "Session time unavailable"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {note.admin_feedback || "The admin marked this note for revision."}
                    </p>
                    {session ? (
                      <Link href={`/tutor/sessions/${session.id}/notes`} className="secondary-button mt-4 inline-flex px-4 py-2">
                        Revise notes
                      </Link>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="font-medium text-foreground">No revisions are waiting.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Submitted notes will stay visible here if the admin requests changes.
                </p>
              </div>
            )}
            {recentRevisionSession && !needsRevisionNotes.length ? (
              <p className="text-sm text-muted-foreground">{recentRevisionSession.subject}</p>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
