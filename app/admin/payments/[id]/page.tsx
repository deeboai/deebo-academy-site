import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyParentById,
  getAcademyPaymentById,
  getAcademySessionById,
  getAcademyStudentById,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { updateAcademyPaymentAction } from "@/actions/academy-os-admin";

type PaymentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminPaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const payment = await getAcademyPaymentById(id);

  if (!payment) {
    notFound();
  }

  const [parent, student, session] = await Promise.all([
    payment.parent_id ? getAcademyParentById(payment.parent_id) : Promise.resolve(null),
    payment.student_id ? getAcademyStudentById(payment.student_id) : Promise.resolve(null),
    payment.session_id ? getAcademySessionById(payment.session_id) : Promise.resolve(null),
  ]);

  return (
    <AdminShell
      title="Payment detail"
      subtitle="Update Stripe identifiers and internal payment status without storing card data."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Payment record">
          <form action={updateAcademyPaymentAction} className="space-y-4">
            <input type="hidden" name="payment_id" value={payment.id} />
            <div>
              <label className="field-label">Status</label>
              <input name="status" defaultValue={payment.status} className="field-input" />
            </div>
            <div>
              <label className="field-label">Description</label>
              <input name="description" defaultValue={payment.description ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Stripe customer ID</label>
              <input
                name="stripe_customer_id"
                defaultValue={payment.stripe_customer_id ?? ""}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Checkout session ID</label>
              <input
                name="stripe_checkout_session_id"
                defaultValue={payment.stripe_checkout_session_id ?? ""}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Invoice ID</label>
              <input name="stripe_invoice_id" defaultValue={payment.stripe_invoice_id ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Payment intent ID</label>
              <input
                name="stripe_payment_intent_id"
                defaultValue={payment.stripe_payment_intent_id ?? ""}
                className="field-input"
              />
            </div>
            <button type="submit" className="primary-button">
              Save payment
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Linked records">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Parent: {parent ? parent.full_name : "No parent linked"}</p>
            <p>Student: {student ? `${student.first_name} ${student.last_name ?? ""}` : "No student linked"}</p>
            <p>Session: {session ? `${session.subject} · ${new Date(session.starts_at).toLocaleString()}` : "No session linked"}</p>
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
