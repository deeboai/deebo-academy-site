import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademySessionsByStudentId,
  getAcademyStudentById,
  getAcademyStudentSubjectsByStudentId,
  getAcademyPortalAccountByEntity,
  getAcademyParentById,
  listAcademyParents,
  listAcademyTutors,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  assignTutorToStudentSubjectAction,
  disableAcademyPortalAccountAction,
  enableAcademyPortalAccountAction,
  inviteAcademyPortalAccountAction,
  revokeAcademyPortalAccountSessionsAction,
  sendAcademyPortalPasswordResetAction,
  upsertAcademyStudentPortalAccountAction,
  updateAcademyStudentAction,
} from "@/actions/academy-os-admin";

type StudentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminStudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const student = await getAcademyStudentById(id);

  if (!student) {
    notFound();
  }

  const [parent, parents, studentSubjects, tutors, sessions, studentUser] = await Promise.all([
    student.parent_id ? getAcademyParentById(student.parent_id) : Promise.resolve(null),
    listAcademyParents(),
    getAcademyStudentSubjectsByStudentId(student.id),
    listAcademyTutors(),
    getAcademySessionsByStudentId(student.id),
    getAcademyPortalAccountByEntity({ role: "student", entityId: student.id }),
  ]);

  return (
    <AdminShell
      title={`${student.first_name} ${student.last_name ?? ""}`.trim()}
      subtitle="Update the student record, assign tutors to subject records, and review related sessions."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <SectionCard title="Student record">
          <form action={updateAcademyStudentAction} className="space-y-4">
            <input type="hidden" name="student_id" value={student.id} />
            <div>
              <label className="field-label">First name</label>
              <input name="first_name" defaultValue={student.first_name} className="field-input" />
            </div>
            <div>
              <label className="field-label">Last name</label>
              <input name="last_name" defaultValue={student.last_name ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Grade / level</label>
              <input name="grade" defaultValue={student.grade} className="field-input" />
            </div>
            <div>
              <label className="field-label">School name</label>
              <input name="school_name" defaultValue={student.school_name ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Linked contact</label>
              <select name="parent_id" defaultValue={student.parent_id ?? ""} className="field-input">
                <option value="">No contact linked yet</option>
                {parents.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name} · {candidate.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Status</label>
              <input name="status" defaultValue={student.status} className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save student
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Parent link">
            <p className="text-sm text-muted-foreground">
              {parent ? `${parent.full_name} · ${parent.email}` : "No contact is linked yet."}
            </p>
          </SectionCard>

          <SectionCard
            title="Student portal access"
            description="This email must match a Supabase Auth user before the student can use the student portal."
          >
            <form action={upsertAcademyStudentPortalAccountAction} className="space-y-4">
              <input type="hidden" name="student_id" value={student.id} />
              <div>
                <label className="field-label">Student portal email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={studentUser?.email ?? ""}
                  className="field-input"
                  placeholder="student@school.edu"
                  required
                />
              </div>
              <div>
                <label className="field-label">Access status</label>
                <input
                  name="status"
                  defaultValue={studentUser?.status ?? "active"}
                  className="field-input"
                />
              </div>
              <button type="submit" className="secondary-button">
                Save portal access
              </button>
            </form>
            {studentUser ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <div className="w-full text-sm text-muted-foreground">
                  <p>Last login: {studentUser.last_login_at ? new Date(studentUser.last_login_at).toLocaleString() : "Never"}</p>
                  <p className="mt-1">
                    Forced re-auth: {studentUser.force_reauth_after ? new Date(studentUser.force_reauth_after).toLocaleString() : "Never"}
                  </p>
                </div>
                <form action={inviteAcademyPortalAccountAction}>
                  <input type="hidden" name="account_id" value={studentUser.id} />
                  <button type="submit" className="secondary-button px-4 py-2">Send invite</button>
                </form>
                <form action={sendAcademyPortalPasswordResetAction}>
                  <input type="hidden" name="account_id" value={studentUser.id} />
                  <button type="submit" className="secondary-button px-4 py-2">Reset password</button>
                </form>
                <form action={revokeAcademyPortalAccountSessionsAction}>
                  <input type="hidden" name="account_id" value={studentUser.id} />
                  <button type="submit" className="secondary-button px-4 py-2">Revoke sessions</button>
                </form>
                {studentUser.status === "disabled" ? (
                  <form action={enableAcademyPortalAccountAction}>
                    <input type="hidden" name="account_id" value={studentUser.id} />
                    <button type="submit" className="primary-button px-4 py-2">Enable</button>
                  </form>
                ) : (
                  <form action={disableAcademyPortalAccountAction}>
                    <input type="hidden" name="account_id" value={studentUser.id} />
                    <button type="submit" className="secondary-button px-4 py-2">Disable</button>
                  </form>
                )}
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Subject records">
            <div className="space-y-4">
              {studentSubjects.length
                ? studentSubjects.map((subject) => (
                    <form
                      key={subject.id}
                      action={assignTutorToStudentSubjectAction}
                      className="rounded-2xl border border-border/70 bg-background/50 p-4"
                    >
                      <input type="hidden" name="student_subject_id" value={subject.id} />
                      <p className="font-medium text-foreground">
                        {subject.subject} · {subject.course_name || "Course name pending"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Level: {subject.level || "Not set"}
                      </p>
                      <label className="field-label mt-4">Assigned tutor</label>
                      <select name="tutor_id" defaultValue={subject.tutor_id ?? ""} className="field-input">
                        <option value="">Unassigned</option>
                        {tutors.map((tutor) => (
                          <option key={tutor.id} value={tutor.id}>
                            {tutor.full_name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="secondary-button mt-4 px-4 py-2">
                        Save tutor assignment
                      </button>
                    </form>
                  ))
                : "No subject records are linked yet."}
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
                : "No sessions are linked yet."}
            </div>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
