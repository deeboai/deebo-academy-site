import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionById, getAcademyStudentById, getAcademyValidatedSessionNoteBySessionId } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

type TutorSessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TutorSessionDetailPage({ params }: TutorSessionDetailPageProps) {
  const { id } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const session = await getAcademySessionById(id);

  if (!session || session.tutor_id !== tutor.id) {
    notFound();
  }

  const [student, note] = await Promise.all([
    session.student_id ? getAcademyStudentById(session.student_id) : Promise.resolve(null),
    getAcademyValidatedSessionNoteBySessionId(session.id),
  ]);

  return (
    <PortalShell
      title={session.subject}
      subtitle="Review the assigned session context before or after the tutoring meeting."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Session context">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Student: {student ? `${student.first_name} ${student.last_name ?? ""}` : "No student linked"}</p>
            <p>Course: {session.course_name || "Course name pending"}</p>
            <p>Starts: {new Date(session.starts_at).toLocaleString()}</p>
            <p>Meeting URL: {session.meeting_url || "Not attached yet"}</p>
          </div>
        </SectionCard>

        <SectionCard title="Current note status">
          <p className="text-sm text-muted-foreground">
            {note ? note.what_was_covered : "No validated note is attached yet."}
          </p>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
