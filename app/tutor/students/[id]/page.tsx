import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getTutorPortalSessionNotes,
  getTutorPortalSessionsByStudentId,
  getTutorPortalStudentById,
  getTutorPortalStudentSubjects,
} from "@/lib/academy-portal-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

type TutorStudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TutorStudentDetailPage({ params }: TutorStudentDetailPageProps) {
  const { id } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const student = await getTutorPortalStudentById(tutor.id, id);

  if (!student) {
    notFound();
  }

  const [subjects, sessions, notes] = await Promise.all([
    getTutorPortalStudentSubjects(tutor.id, student.id),
    getTutorPortalSessionsByStudentId(tutor.id, student.id),
    getTutorPortalSessionNotes(tutor.id),
  ]);
  const upcomingSessions = sessions
    .filter((session) => new Date(session.starts_at) >= new Date())
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());

  return (
    <PortalShell
      title={`${student.first_name} ${student.last_name ?? ""}`.trim()}
      subtitle="Tutor-facing student context stays limited to assigned work, but it should still make subject coverage and revision state clear."
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
        <SectionCard title="Student overview">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Grade: {student.grade}</p>
            <p>School: {student.school_name || "Not provided"}</p>
            <p>Upcoming sessions: {upcomingSessions.length}</p>
            <p>
              Notes needing revision: {
                notes.filter((note) => {
                  const session = sessions.find((candidate) => candidate.id === note.session_id);
                  return session && note.admin_status === "needs_revision";
                }).length
              }
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Assigned subjects">
          <div className="space-y-3 text-sm text-muted-foreground">
            {subjects.length ? (
              subjects.map((subject) => (
                <div key={subject.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">{subject.subject}</p>
                  <p className="mt-1">{subject.course_name || "Course name pending"}</p>
                  <p className="mt-1">Level: {subject.level || "Not specified"}</p>
                </div>
              ))
            ) : (
              <p>No assigned subject records are linked yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming sessions">
          <div className="space-y-3 text-sm text-muted-foreground">
            {upcomingSessions.length ? (
              upcomingSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">{session.subject}</p>
                  <p className="mt-1">{new Date(session.starts_at).toLocaleString()}</p>
                  <p className="mt-1">Status: {session.status}</p>
                </div>
              ))
            ) : (
              <p>No upcoming sessions are assigned yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Session history">
          <div className="space-y-3 text-sm text-muted-foreground">
            {sessions.length ? (
              sessions.map((session) => {
                const note = notes.find((candidate) => candidate.session_id === session.id);

                return (
                  <div key={session.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="font-medium text-foreground">{session.subject}</p>
                    <p className="mt-1">{new Date(session.starts_at).toLocaleString()}</p>
                    <p className="mt-1">Note status: {note?.admin_status || "Not started"}</p>
                    <p className="mt-1">{note?.admin_feedback || "No admin feedback attached."}</p>
                  </div>
                );
              })
            ) : (
              <p>No sessions are linked yet.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
