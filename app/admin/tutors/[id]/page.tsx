import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyTutorById,
  getAcademySessionsByTutorId,
  getAcademyPortalAccountByEntity,
  listAcademyStudentSubjects,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  disableAcademyPortalAccountAction,
  enableAcademyPortalAccountAction,
  inviteAcademyPortalAccountAction,
  revokeAcademyPortalAccountSessionsAction,
  sendAcademyPortalPasswordResetAction,
  upsertAcademyTutorAction,
} from "@/actions/academy-os-admin";

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

  const [sessions, studentSubjects, accessAccount] = await Promise.all([
    getAcademySessionsByTutorId(tutor.id),
    listAcademyStudentSubjects(),
    getAcademyPortalAccountByEntity({ role: "tutor", entityId: tutor.id }),
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
          <SectionCard
            title="Portal access"
            description="Tutor login uses this access row and the matching Supabase Auth user."
          >
            {accessAccount ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>{accessAccount.email}</p>
                  <p className="mt-1">Status: {accessAccount.status}</p>
                  <p className="mt-1">Last login: {accessAccount.last_login_at ? new Date(accessAccount.last_login_at).toLocaleString() : "Never"}</p>
                  <p className="mt-1">
                    Forced re-auth: {accessAccount.force_reauth_after ? new Date(accessAccount.force_reauth_after).toLocaleString() : "Never"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={inviteAcademyPortalAccountAction}>
                    <input type="hidden" name="account_id" value={accessAccount.id} />
                    <button type="submit" className="secondary-button px-4 py-2">Send invite</button>
                  </form>
                  <form action={sendAcademyPortalPasswordResetAction}>
                    <input type="hidden" name="account_id" value={accessAccount.id} />
                    <button type="submit" className="secondary-button px-4 py-2">Reset password</button>
                  </form>
                  <form action={revokeAcademyPortalAccountSessionsAction}>
                    <input type="hidden" name="account_id" value={accessAccount.id} />
                    <button type="submit" className="secondary-button px-4 py-2">Revoke sessions</button>
                  </form>
                  {accessAccount.status === "disabled" ? (
                    <form action={enableAcademyPortalAccountAction}>
                      <input type="hidden" name="account_id" value={accessAccount.id} />
                      <button type="submit" className="primary-button px-4 py-2">Enable</button>
                    </form>
                  ) : (
                    <form action={disableAcademyPortalAccountAction}>
                      <input type="hidden" name="account_id" value={accessAccount.id} />
                      <button type="submit" className="secondary-button px-4 py-2">Disable</button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Save this tutor record to create the access row.</p>
            )}
          </SectionCard>

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
