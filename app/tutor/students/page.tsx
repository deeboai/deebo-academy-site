import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getTutorPortalSessionNotes,
  getTutorPortalSessions,
  getTutorPortalStudents,
  getTutorPortalStudentSubjects,
} from "@/lib/academy-portal-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

export default async function TutorStudentsPage() {
  const { user, tutor } = await requireAcademyTutorUser();
  const [students, sessions, notes] = await Promise.all([
    getTutorPortalStudents(tutor.id),
    getTutorPortalSessions(tutor.id),
    getTutorPortalSessionNotes(tutor.id),
  ]);
  const subjectsByStudent = new Map(
    await Promise.all(
      students.map(async (student) => {
        return [student.id, await getTutorPortalStudentSubjects(tutor.id, student.id)] as const;
      }),
    ),
  );

  return (
    <PortalShell
      title="Tutor Students"
      subtitle="Assigned students stay grouped here together with subject coverage, upcoming sessions, and revision load."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/students", label: "Students" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <SectionCard title="Assigned students">
        <div className="space-y-4">
          {students.length ? (
            students.map((student) => {
              const subjects = subjectsByStudent.get(student.id) ?? [];
              const studentSessions = sessions.filter((session) => session.student_id === student.id);
              const studentRevisionCount = notes.filter((note) => {
                const session = studentSessions.find((candidate) => candidate.id === note.session_id);
                return session && note.admin_status === "needs_revision";
              }).length;

              return (
                <article key={student.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {student.first_name} {student.last_name ?? ""}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{student.grade}</p>
                      <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                        <p>Assigned subjects: {subjects.length}</p>
                        <p>Sessions: {studentSessions.length}</p>
                        <p>Needs revision: {studentRevisionCount}</p>
                      </div>
                    </div>
                    <Link href={`/tutor/students/${student.id}`} className="secondary-button px-4 py-2">
                      Open
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No students are assigned to this tutor yet.</p>
          )}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
