import { beginAcademyParentCheckoutAction } from "@/actions/academy-parent-payments";
import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getParentPortalPayments, getParentPortalSessions } from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

type ParentPaymentsPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    payment?: string;
  }>;
};

function formatMoney(amountCents: number, currency: string) {
  return (amountCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function getCheckoutMessage(input: { checkout?: string; payment?: string }) {
  if (input.checkout === "success") {
    return {
      tone: "success" as const,
      text: "Stripe accepted the payment. The Academy payment status will update here as soon as the webhook completes.",
    };
  }

  if (input.checkout === "cancel") {
    return {
      tone: "neutral" as const,
      text: "Checkout was canceled. The payment record is still available if you need to try again.",
    };
  }

  return null;
}

export default async function ParentPaymentsPage({ searchParams }: ParentPaymentsPageProps) {
  const { user, parent } = await requireAcademyParentUser();
  const params = (await searchParams) ?? {};
  const [payments, sessions] = await Promise.all([
    getParentPortalPayments(parent.id),
    getParentPortalSessions(parent.id),
  ]);
  const outstandingPayments = payments.filter((payment) => payment.status === "pending" || payment.status === "failed");
  const settledPayments = payments.filter((payment) => !outstandingPayments.includes(payment));
  const checkoutMessage = getCheckoutMessage(params);

  return (
    <PortalShell
      title="Payments"
      subtitle="Review open balances, pay eligible Academy charges through Stripe Checkout, and track the resulting payment status."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      {checkoutMessage ? (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
            checkoutMessage.tone === "success"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
              : "border-border/70 bg-background/60 text-muted-foreground"
          }`}
        >
          {checkoutMessage.text}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Open payments"
          description="Pending and failed items can be paid securely through Stripe Checkout."
        >
          <div className="space-y-4">
            {outstandingPayments.length ? (
              outstandingPayments.map((payment) => {
                const session = sessions.find((candidate) => candidate.id === payment.session_id);

                return (
                  <article key={payment.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {formatMoney(payment.amount_cents, payment.currency)}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {payment.description || "Academy payment"}
                        </p>
                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <p>Status: {payment.status}</p>
                          <p>Created: {new Date(payment.created_at).toLocaleString()}</p>
                          <p>
                            Session: {session ? `${session.subject} · ${new Date(session.starts_at).toLocaleString()}` : "No session linked"}
                          </p>
                        </div>
                      </div>
                      <form action={beginAcademyParentCheckoutAction}>
                        <input type="hidden" name="payment_id" value={payment.id} />
                        <button type="submit" className="primary-button px-4 py-2">
                          Pay now
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No open Academy payment records are waiting for checkout.
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Payment history"
          description="Completed, waived, and refunded records stay visible here for reference."
        >
          <div className="space-y-4">
            {settledPayments.length ? (
              settledPayments.map((payment) => {
                const session = sessions.find((candidate) => candidate.id === payment.session_id);

                return (
                  <article key={payment.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                    <h3 className="font-semibold text-foreground">
                      {formatMoney(payment.amount_cents, payment.currency)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{payment.description || "Academy payment"}</p>
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p>Status: {payment.status}</p>
                      <p>Recorded: {new Date(payment.created_at).toLocaleString()}</p>
                      <p>
                        Session: {session ? `${session.subject} · ${new Date(session.starts_at).toLocaleString()}` : "No session linked"}
                      </p>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No settled payment records are available yet.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
