import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getParentPortalPayments,
  getParentPortalStudentById,
  getParentPortalValidatedSessionNotes,
  getPortalStudentSubjects,
  getParentPortalSessions,
} from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

type ParentStudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentStudentDetailPage({ params }: ParentStudentDetailPageProps) {
  const { id } = await params;
  const { user, parent } = await requireAcademyParentUser();
  const student = await getParentPortalStudentById(parent.id, id);

  if (!student) {
    notFound();
  }

  const [subjects, sessions, payments, notes] = await Promise.all([
    getPortalStudentSubjects(student.id),
    getParentPortalSessions(parent.id),
    getParentPortalPayments(parent.id),
    getParentPortalValidatedSessionNotes(parent.id),
  ]);
  const studentSessions = sessions
    .filter((session) => session.student_id === student.id)
    .sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime());
  const upcomingSessions = studentSessions.filter((session) => new Date(session.starts_at) >= new Date());
  const openPayments = payments.filter((payment) => {
    return payment.student_id === student.id && (payment.status === "pending" || payment.status === "failed");
  });
  const openBalanceCents = openPayments.reduce((total, payment) => total + payment.amount_cents, 0);

  return (
    <PortalShell
      title={`${student.first_name} ${student.last_name ?? ""}`.trim()}
      subtitle="View subject coverage, upcoming sessions, recap availability, and payment obligations associated with this student."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Student overview">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Grade: {student.grade}</p>
            <p>School: {student.school_name || "Not provided"}</p>
            <p>Upcoming sessions: {upcomingSessions.length}</p>
            <p>
              Open balance: {(openBalanceCents / 100).toLocaleString("en-US", {
                style: "currency",
                currency: payments[0]?.currency?.toUpperCase() ?? "USD",
              })}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Course relationships">
          <div className="space-y-3 text-sm text-muted-foreground">
            {subjects.length
              ? subjects.map((subject) => (
                  <div key={subject.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="font-medium text-foreground">{subject.subject}</p>
                    <p className="mt-1">{subject.course_name || "Course name pending"}</p>
                    <p className="mt-1">Level: {subject.level || "Not specified"}</p>
                  </div>
                ))
              : "No course records are linked yet."}
          </div>
        </SectionCard>

        <SectionCard title="Upcoming sessions">
          <div className="space-y-3 text-sm text-muted-foreground">
            {upcomingSessions.length
              ? upcomingSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="font-medium text-foreground">{session.subject}</p>
                    <p className="mt-1">{new Date(session.starts_at).toLocaleString()}</p>
                    <p className="mt-1">Status: {session.status}</p>
                  </div>
                ))
              : "No upcoming sessions are linked yet."}
          </div>
        </SectionCard>

        <SectionCard title="Session history">
          <div className="space-y-3 text-sm text-muted-foreground">
            {studentSessions.length
              ? studentSessions.map((session) => {
                  const note = notes.find((candidate) => candidate.session_id === session.id);

                  return (
                    <div key={session.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                      <p className="font-medium text-foreground">{session.subject}</p>
                      <p className="mt-1">{new Date(session.starts_at).toLocaleString()}</p>
                      <p className="mt-1">Status: {session.status}</p>
                      <p className="mt-1">Recap: {note ? "Validated" : "Not available yet"}</p>
                    </div>
                  );
                })
              : "No sessions are linked yet."}
          </div>
        </SectionCard>

        <SectionCard title="Payment summary">
          <div className="space-y-3 text-sm text-muted-foreground">
            {openPayments.length
              ? openPayments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <p className="font-medium text-foreground">
                      {(payment.amount_cents / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: payment.currency.toUpperCase(),
                      })}
                    </p>
                    <p className="mt-1">{payment.description || "Academy payment"}</p>
                    <p className="mt-1">Status: {payment.status}</p>
                  </div>
                ))
              : "No open payment records are linked to this student."}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
