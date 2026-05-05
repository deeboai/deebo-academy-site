import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademyParents,
  listAcademyStudents,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { createAcademyParentAction } from "@/actions/academy-os-admin";

export default async function AcademyAdminParentsPage() {
  const user = await requireAcademyAdminUser();
  const [parents, students] = await Promise.all([
    listAcademyParents(),
    listAcademyStudents(),
  ]);

  return (
    <AdminShell
      title="Parents"
      subtitle="Parent records anchor communication, payments, and visibility across the Academy workflow."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard
          title="Add contact"
          description="Create a parent or adult student contact directly from admin without going through intake first."
        >
          <form action={createAcademyParentAction} className="space-y-4">
            <div>
              <label className="field-label">Full name</label>
              <input name="full_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input name="email" type="email" className="field-input" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input name="phone" className="field-input" />
            </div>
            <div>
              <label className="field-label">Stripe customer ID</label>
              <input name="stripe_customer_id" className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save contact
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Parent records"
          description="Each record becomes the contact anchor for sessions, payments, and recaps."
        >
          {parents.length ? (
            <div className="space-y-4">
              {parents.map((parent) => {
                const linkedStudents = students.filter((student) => student.parent_id === parent.id);

                return (
                  <article key={parent.id} className="record-row">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="workspace-eyebrow">Contact</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{parent.full_name}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{parent.email}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {parent.phone || "No phone number on file"}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Students linked: {linkedStudents.length}
                        </p>
                      </div>
                      <Link
                        href={`/admin/parents/${parent.id}`}
                        className="secondary-button px-4 py-2"
                      >
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No parent records yet"
              description="Create the first contact here or convert an intake into parent and student records."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
