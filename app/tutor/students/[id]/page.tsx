import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionsByStudentId, getAcademyStudentById, getAcademyStudentSubjectsByStudentId } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

type TutorStudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TutorStudentDetailPage({ params }: TutorStudentDetailPageProps) {
  const { id } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const student = await getAcademyStudentById(id);

  if (!student) {
    notFound();
  }

  const [subjects, sessions] = await Promise.all([
    getAcademyStudentSubjectsByStudentId(student.id),
    getAcademySessionsByStudentId(student.id),
  ]);
  const assignedSubjects = subjects.filter((subject) => subject.tutor_id === tutor.id);

  if (!assignedSubjects.length && !sessions.some((session) => session.tutor_id === tutor.id)) {
    notFound();
  }

  return (
    <PortalShell
      title={`${student.first_name} ${student.last_name ?? ""}`.trim()}
      subtitle="Tutor-facing student context stays limited to assigned work only."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Assigned subjects">
          <div className="space-y-3 text-sm text-muted-foreground">
            {assignedSubjects.map((subject) => (
              <p key={subject.id}>
                {subject.subject} · {subject.course_name || "Course name pending"}
              </p>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Sessions">
          <div className="space-y-3 text-sm text-muted-foreground">
            {sessions
              .filter((session) => session.tutor_id === tutor.id)
              .map((session) => (
                <p key={session.id}>
                  {session.subject} · {new Date(session.starts_at).toLocaleString()}
                </p>
              ))}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
