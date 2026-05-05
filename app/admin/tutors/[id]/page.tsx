import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyTutorById,
  getAcademySessionsByTutorId,
  listAcademyStudentSubjects,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { upsertAcademyTutorAction } from "@/actions/academy-os-admin";

type TutorDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminTutorDetailPage({ params }: TutorDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const tutor = await getAcademyTutorById(id);

  if (!tutor) {
    notFound();
  }

  const [sessions, studentSubjects] = await Promise.all([
    getAcademySessionsByTutorId(tutor.id),
    listAcademyStudentSubjects(),
  ]);
  const assignedSubjects = studentSubjects.filter((subject) => subject.tutor_id === tutor.id);

  return (
    <AdminShell
      title={tutor.full_name}
      subtitle="Update the tutor record and review assigned student subjects and sessions."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <SectionCard title="Tutor record">
          <form action={upsertAcademyTutorAction} className="space-y-4">
            <input type="hidden" name="tutor_id" value={tutor.id} />
            <div>
              <label className="field-label">Full name</label>
              <input name="full_name" defaultValue={tutor.full_name} className="field-input" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input name="email" defaultValue={tutor.email} className="field-input" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input name="phone" defaultValue={tutor.phone ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Subjects</label>
              <input
                name="subjects"
                defaultValue={tutor.subjects.join(", ")}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Levels</label>
              <input name="levels" defaultValue={tutor.levels.join(", ")} className="field-input" />
            </div>
            <div>
              <label className="field-label">Hourly rate (cents)</label>
              <input
                name="hourly_rate_cents"
                defaultValue={tutor.hourly_rate_cents ?? ""}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Internal notes</label>
              <textarea
                name="internal_notes"
                rows={6}
                defaultValue={tutor.internal_notes ?? ""}
                className="field-input"
              />
            </div>
            <button type="submit" className="primary-button">
              Save tutor
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Assigned student subjects">
            <div className="space-y-3 text-sm text-muted-foreground">
              {assignedSubjects.length
                ? assignedSubjects.map((subject) => (
                    <p key={subject.id}>
                      {subject.subject} · {subject.course_name || "Course name pending"}
                    </p>
                  ))
                : "No student subjects are assigned yet."}
            </div>
          </SectionCard>

          <SectionCard title="Sessions">
            <div className="space-y-3 text-sm text-muted-foreground">
              {sessions.length
                ? sessions.map((session) => (
                    <p key={session.id}>
                      {session.subject} · {new Date(session.starts_at).toLocaleString()} · {session.status}
                    </p>
                  ))
                : "No sessions are assigned yet."}
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
