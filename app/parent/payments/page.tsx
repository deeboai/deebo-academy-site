import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademyPaymentsByParentId } from "@/lib/academy-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

export default async function ParentPaymentsPage() {
  const { user, parent } = await requireAcademyParentUser();
  const payments = await getAcademyPaymentsByParentId(parent.id);

  return (
    <PortalShell
      title="Payments"
      subtitle="Payment status is visible here without exposing Stripe internals that parents do not need."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <SectionCard title="Payment records">
        <div className="space-y-4">
          {payments.map((payment) => (
            <article key={payment.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <h3 className="font-semibold text-foreground">
                {(payment.amount_cents / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: payment.currency.toUpperCase(),
                })}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{payment.status}</p>
              <p className="mt-1 text-sm text-muted-foreground">{payment.description || "No description"}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
