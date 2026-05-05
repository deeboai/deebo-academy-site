import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { listAcademyTutors } from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { upsertAcademyTutorAction } from "@/actions/academy-os-admin";

export default async function AcademyAdminTutorsPage() {
  const user = await requireAcademyAdminUser();
  const tutors = await listAcademyTutors();

  return (
    <AdminShell
      title="Tutors"
      subtitle="Create tutor records, capture subject coverage, and prepare future assignment and notes workflows."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <SectionCard title="Add tutor" description="Tutor records stay lightweight here so the assignment workflow can grow without extra setup.">
          <form action={upsertAcademyTutorAction} className="space-y-4">
            <div>
              <label className="field-label">Full name</label>
              <input name="full_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input name="email" className="field-input" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input name="phone" className="field-input" />
            </div>
            <div>
              <label className="field-label">Subjects</label>
              <input name="subjects" className="field-input" placeholder="algebra, calculus, chemistry" />
            </div>
            <div>
              <label className="field-label">Levels</label>
              <input name="levels" className="field-input" placeholder="middle school, high school, college" />
            </div>
            <div>
              <label className="field-label">Hourly rate (cents)</label>
              <input name="hourly_rate_cents" className="field-input" />
            </div>
            <div>
              <label className="field-label">Internal notes</label>
              <textarea name="internal_notes" rows={5} className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save tutor
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Tutor records">
          {tutors.length ? (
            <div className="space-y-4">
              {tutors.map((tutor) => (
                <article key={tutor.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{tutor.full_name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tutor.email}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Subjects: {tutor.subjects.length ? tutor.subjects.join(", ") : "None listed"}
                      </p>
                    </div>
                    <Link href={`/admin/tutors/${tutor.id}`} className="secondary-button px-4 py-2">
                      Open
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No tutor records yet"
              description="Add the first tutor record to start handling student-subject assignments and session notes."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
