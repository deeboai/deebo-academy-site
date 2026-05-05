import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { listAcademyStudents } from "@/lib/academy-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

export default async function ParentStudentsPage() {
  const { user, parent } = await requireAcademyParentUser();
  const students = (await listAcademyStudents()).filter((student) => student.parent_id === parent.id);

  return (
    <PortalShell
      title="Students"
      subtitle="Student records summarize the current course context connected to this parent account."
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
          {students.map((student) => (
            <article key={student.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {student.first_name} {student.last_name ?? ""}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{student.grade}</p>
                </div>
                <Link href={`/parent/students/${student.id}`} className="secondary-button px-4 py-2">
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
