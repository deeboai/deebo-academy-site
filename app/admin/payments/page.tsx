import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademyParents,
  listAcademyPayments,
  listAcademySessions,
  listAcademyStudents,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { createAcademyPaymentAction } from "@/actions/academy-os-admin";

export default async function AcademyAdminPaymentsPage() {
  const user = await requireAcademyAdminUser();
  const [payments, parents, students, sessions] = await Promise.all([
    listAcademyPayments(),
    listAcademyParents(),
    listAcademyStudents(),
    listAcademySessions(),
  ]);

  return (
    <AdminShell
      title="Payments"
      subtitle="Payments stay operationally visible here while Stripe remains the actual money system."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <SectionCard title="Add payment record">
          <form action={createAcademyPaymentAction} className="space-y-4">
            <div>
              <label className="field-label">Parent</label>
              <select name="parent_id" className="field-input">
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Student</label>
              <select name="student_id" className="field-input">
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name ?? ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Session</label>
              <select name="session_id" className="field-input" defaultValue="">
                <option value="">No session linked</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.subject} · {new Date(session.starts_at).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Amount (cents)</label>
              <input name="amount_cents" className="field-input" />
            </div>
            <div>
              <label className="field-label">Description</label>
              <input name="description" className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save payment
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Payment records">
          {payments.length ? (
            <div className="space-y-4">
              {payments.map((payment) => {
                const parent = parents.find((candidate) => candidate.id === payment.parent_id);
                const student = students.find((candidate) => candidate.id === payment.student_id);

                return (
                  <article key={payment.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {(payment.amount_cents / 100).toLocaleString("en-US", {
                            style: "currency",
                            currency: payment.currency.toUpperCase(),
                          })}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {parent?.full_name || "No parent linked"} · {student?.first_name || "No student linked"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{payment.status}</p>
                      </div>
                      <Link href={`/admin/payments/${payment.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No payment records yet"
              description="Payment records will appear here when Academy charges, invoices, or manual tracking entries are created."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
