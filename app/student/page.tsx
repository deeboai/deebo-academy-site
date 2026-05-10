import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getPortalStudentSubjects,
  getStudentPortalSessions,
  getStudentPortalValidatedSessionNotes,
} from "@/lib/academy-portal-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

export default async function StudentHomePage() {
  const { user, student } = await requireAcademyStudentUser();
  const [sessions, subjects, notes] = await Promise.all([
    getStudentPortalSessions(student.id),
    getPortalStudentSubjects(student.id),
    getStudentPortalValidatedSessionNotes(student.id),
  ]);
  const now = new Date();
  // The student portal stays intentionally narrow: upcoming session work and validated recap guidance only.
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const latestRecap = notes[0] ?? null;
  const nextSession = upcomingSessions[0] ?? null;

  return (
    <PortalShell
      title="Student Portal"
      subtitle="Track the next tutoring session, review validated recaps, and keep homework or follow-up work in one read-only workspace."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Upcoming sessions">
          <p className="text-3xl font-semibold text-foreground">{upcomingSessions.length}</p>
        </SectionCard>
        <SectionCard title="Validated recaps">
          <p className="text-3xl font-semibold text-foreground">{notes.length}</p>
        </SectionCard>
        <SectionCard title="Subjects">
          <p className="text-3xl font-semibold text-foreground">{subjects.length}</p>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionCard
          title="Next session"
          description="Students should be able to see the next live session and the relevant join details without parent-facing operational noise."
        >
          {nextSession ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <h2 className="font-semibold text-foreground">{nextSession.subject}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nextSession.course_name || "Course name pending"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {new Date(nextSession.starts_at).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Status: {nextSession.status}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/student/sessions/${nextSession.id}`} className="secondary-button px-4 py-2">
                    Open session
                  </Link>
                  {nextSession.meeting_url ? (
                    <a
                      href={nextSession.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary-button px-4 py-2"
                    >
                      Join meeting
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <p className="font-medium text-foreground">No upcoming session is scheduled yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Once the Academy team schedules the next session, it will appear here.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Latest recap"
          description="Only Academy-validated notes are exposed here so the student sees the finalized instructional record."
        >
          {latestRecap ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-sm font-medium text-foreground">What was covered</p>
                <p className="mt-2 text-sm text-muted-foreground">{latestRecap.what_was_covered}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="text-sm font-medium text-foreground">Homework or follow-up</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {latestRecap.recommended_homework || "No homework was assigned in the latest validated recap."}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <p className="font-medium text-foreground">No validated recap is available yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Session guidance will appear here after the Academy team reviews the tutor notes.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Portal scope"
          description="This portal is intentionally narrow so students only see the learning workflow that is ready for them."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Use this portal to review session details, join upcoming meetings, and revisit validated recaps.</p>
            <p>Billing, access changes, and admin operations stay in the parent or Academy admin workflows.</p>
            <p>
              If the access email needs to change, the Academy team must update the linked student portal access row.
            </p>
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
