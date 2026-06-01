import { AdminShell } from "@/components/admin/admin-shell";
import { CheckoutOpsDashboard } from "@/components/admin/checkout-ops-dashboard";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { decryptStoredAccessCode } from "@/lib/checkout/code-secrets";
import {
  listCheckoutAccessCodes,
  listCheckoutPlans,
  listCheckoutPromoCodes,
} from "@/lib/checkout/service";

export default async function AcademyAdminCheckoutPage() {
  const user = await requireAcademyAdminUser();
  const [plans, accessCodes, promoCodes] = await Promise.all([
    listCheckoutPlans(),
    listCheckoutAccessCodes(),
    listCheckoutPromoCodes(),
  ]);

  // Decrypting server-side keeps the readable code available to admins without exposing raw hashes.
  const hydratedAccessCodes = accessCodes.map((accessCode) => ({
    ...accessCode,
    code: (() => {
      try {
        return decryptStoredAccessCode(accessCode.encrypted_code);
      } catch {
        return null;
      }
    })(),
  }));

  return (
    <AdminShell
      title="Checkout operations"
      subtitle="Manage monthly plans, enrollment access codes, and promo codes for the Deebo Academy approval-only checkout flow."
      userEmail={user.email ?? "Signed-in admin"}
    >
      <CheckoutOpsDashboard
        plans={plans}
        accessCodes={hydratedAccessCodes}
        promoCodes={promoCodes}
      />
    </AdminShell>
  );
}
