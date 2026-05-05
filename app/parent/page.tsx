import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademyPaymentsByParentId, getAcademySessionsByParentId, listAcademyStudents } from "@/lib/academy-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

export default async function ParentHomePage() {
  const { user, parent } = await requireAcademyParentUser();
  const [students, sessions, payments] = await Promise.all([
    listAcademyStudents(),
    getAcademySessionsByParentId(parent.id),
    getAcademyPaymentsByParentId(parent.id),
  ]);
  const linkedStudents = students.filter((student) => student.parent_id === parent.id);

  return (
    <PortalShell
      title="Parent Portal"
      subtitle="Review your students, session summaries, recording access, and payment status in one place."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Students">
          <p className="text-3xl font-semibold text-foreground">{linkedStudents.length}</p>
        </SectionCard>
        <SectionCard title="Sessions">
          <p className="text-3xl font-semibold text-foreground">{sessions.length}</p>
        </SectionCard>
        <SectionCard title="Payments">
          <p className="text-3xl font-semibold text-foreground">{payments.length}</p>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
