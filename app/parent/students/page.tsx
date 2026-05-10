import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getParentPortalPayments,
  getParentPortalSessions,
  getParentPortalStudents,
  getPortalStudentSubjects,
} from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

export default async function ParentStudentsPage() {
  const { user, parent } = await requireAcademyParentUser();
  const [students, sessions, payments] = await Promise.all([
    getParentPortalStudents(parent.id),
    getParentPortalSessions(parent.id),
    getParentPortalPayments(parent.id),
  ]);
  const subjectsByStudent = new Map(
    await Promise.all(
      students.map(async (student) => {
        return [student.id, await getPortalStudentSubjects(student.id)] as const;
      }),
    ),
  );

  return (
    <PortalShell
      title="Students"
      subtitle="Each student record now surfaces course context, upcoming workload, and the payments attached to that student."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <SectionCard title="Student records">
        <div className="space-y-4">
          {students.map((student) => {
            const upcomingSessions = sessions.filter((session) => {
              return session.student_id === student.id && new Date(session.starts_at) >= new Date();
            });
            const openPayments = payments.filter((payment) => {
              return payment.student_id === student.id && (payment.status === "pending" || payment.status === "failed");
            });
            const subjects = subjectsByStudent.get(student.id) ?? [];

            return (
              <article key={student.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {student.first_name} {student.last_name ?? ""}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{student.grade}</p>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>Subjects: {subjects.length}</p>
                      <p>Upcoming sessions: {upcomingSessions.length}</p>
                      <p>Open payments: {openPayments.length}</p>
                    </div>
                  </div>
                  <Link href={`/parent/students/${student.id}`} className="secondary-button px-4 py-2">
                    Open
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
