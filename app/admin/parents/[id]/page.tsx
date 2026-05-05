import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyParentById,
  getAcademyPaymentsByParentId,
  getAcademySessionsByParentId,
  listAcademyStudents,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { createAcademyStudentAction, updateAcademyParentAction } from "@/actions/academy-os-admin";

type ParentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminParentDetailPage({ params }: ParentDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const parent = await getAcademyParentById(id);

  if (!parent) {
    notFound();
  }

  const [students, sessions, payments] = await Promise.all([
    listAcademyStudents(),
    getAcademySessionsByParentId(parent.id),
    getAcademyPaymentsByParentId(parent.id),
  ]);
  const linkedStudents = students.filter((student) => student.parent_id === parent.id);

  return (
    <AdminShell
      title={parent.full_name}
      subtitle="Update the parent record and review the linked students, sessions, and payment history."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SectionCard title="Parent record" description="This is the billing and recap contact for the linked students.">
          <form action={updateAcademyParentAction} className="space-y-4">
            <input type="hidden" name="parent_id" value={parent.id} />
            <div>
              <label className="field-label">Full name</label>
              <input name="full_name" defaultValue={parent.full_name} className="field-input" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input name="email" defaultValue={parent.email} className="field-input" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input name="phone" defaultValue={parent.phone ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Stripe customer ID</label>
              <input
                name="stripe_customer_id"
                defaultValue={parent.stripe_customer_id ?? ""}
                className="field-input"
              />
            </div>
            <button type="submit" className="primary-button">
              Save parent
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Linked students">
            <div className="space-y-3 text-sm text-muted-foreground">
              {linkedStudents.length
                ? linkedStudents.map((student) => (
                    <p key={student.id}>
                      {student.first_name} {student.last_name ?? ""} · {student.grade}
                    </p>
                  ))
                : "No students are linked yet."}
            </div>
          </SectionCard>

          <SectionCard
            title="Add student under this contact"
            description="Use this when the contact should be linked immediately to the new student record."
          >
            <form action={createAcademyStudentAction} className="space-y-4">
              <input type="hidden" name="parent_mode" value="existing" />
              <input type="hidden" name="parent_id" value={parent.id} />
              <div>
                <label className="field-label">First name</label>
                <input name="first_name" className="field-input" />
              </div>
              <div>
                <label className="field-label">Last name</label>
                <input name="last_name" className="field-input" />
              </div>
              <div>
                <label className="field-label">Grade / level</label>
                <input name="grade" className="field-input" />
              </div>
              <div>
                <label className="field-label">School name</label>
                <input name="school_name" className="field-input" />
              </div>
              <div>
                <label className="field-label">Student portal email</label>
                <input name="student_portal_email" type="email" className="field-input" />
              </div>
              <div>
                <label className="field-label">Initial subject</label>
                <input name="initial_subject" className="field-input" />
              </div>
              <div>
                <label className="field-label">Initial course name</label>
                <input name="initial_course_name" className="field-input" />
              </div>
              <div>
                <label className="field-label">Initial level</label>
                <input name="initial_level" className="field-input" />
              </div>
              <button type="submit" className="secondary-button">
                Save student
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Sessions">
            <div className="space-y-3 text-sm text-muted-foreground">
              {sessions.length
                ? sessions.map((session) => (
                    <p key={session.id}>
                      {session.subject} · {new Date(session.starts_at).toLocaleString()}
                    </p>
                  ))
                : "No sessions are linked yet."}
            </div>
          </SectionCard>

          <SectionCard title="Payments">
            <div className="space-y-3 text-sm text-muted-foreground">
              {payments.length
                ? payments.map((payment) => (
                    <p key={payment.id}>
                      {(payment.amount_cents / 100).toLocaleString("en-US", {
                        style: "currency",
                        currency: payment.currency.toUpperCase(),
                      })}{" "}
                      · {payment.status}
                    </p>
                  ))
                : "No payments are linked yet."}
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
