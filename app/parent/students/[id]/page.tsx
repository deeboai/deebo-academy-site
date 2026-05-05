import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionsByStudentId, getAcademyStudentById, getAcademyStudentSubjectsByStudentId } from "@/lib/academy-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

type ParentStudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentStudentDetailPage({ params }: ParentStudentDetailPageProps) {
  const { id } = await params;
  const { user, parent } = await requireAcademyParentUser();
  const student = await getAcademyStudentById(id);

  if (!student || student.parent_id !== parent.id) {
    notFound();
  }

  const [subjects, sessions] = await Promise.all([
    getAcademyStudentSubjectsByStudentId(student.id),
    getAcademySessionsByStudentId(student.id),
  ]);

  return (
    <PortalShell
      title={`${student.first_name} ${student.last_name ?? ""}`.trim()}
      subtitle="View the course relationships and session history associated with this student."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Course relationships">
          <div className="space-y-3 text-sm text-muted-foreground">
            {subjects.length
              ? subjects.map((subject) => (
                  <p key={subject.id}>
                    {subject.subject} · {subject.course_name || "Course name pending"}
                  </p>
                ))
              : "No course records are linked yet."}
          </div>
        </SectionCard>

        <SectionCard title="Session history">
          <div className="space-y-3 text-sm text-muted-foreground">
            {sessions.length
              ? sessions.map((session) => (
                  <p key={session.id}>
                    {session.subject} · {new Date(session.starts_at).toLocaleString()} · {session.status}
                  </p>
                ))
              : "No sessions are linked yet."}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
