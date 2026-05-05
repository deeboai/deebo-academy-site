import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyParentById,
  getAcademySessionById,
  getAcademySessionNoteById,
  getAcademyStudentById,
  getAcademyTutorById,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  sendAcademySessionRecapAction,
  validateAcademySessionNoteAction,
} from "@/actions/academy-os-admin";

type SessionNoteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminSessionNoteDetailPage({ params }: SessionNoteDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const note = await getAcademySessionNoteById(id);

  if (!note) {
    notFound();
  }

  const session = note.session_id ? await getAcademySessionById(note.session_id) : null;
  const [student, parent, tutor] = await Promise.all([
    session?.student_id ? getAcademyStudentById(session.student_id) : Promise.resolve(null),
    session?.parent_id ? getAcademyParentById(session.parent_id) : Promise.resolve(null),
    note.tutor_id ? getAcademyTutorById(note.tutor_id) : Promise.resolve(null),
  ]);

  return (
    <AdminShell
      title="Session note detail"
      subtitle="Review the tutor submission, refine the parent-facing language, and validate or email the recap."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <SectionCard title="Validate note">
          <form action={validateAcademySessionNoteAction} className="space-y-4">
            <input type="hidden" name="note_id" value={note.id} />
            <div>
              <label className="field-label">What was covered</label>
              <textarea name="what_was_covered" rows={5} defaultValue={note.what_was_covered} className="field-input" />
            </div>
            <div>
              <label className="field-label">What the student understood</label>
              <textarea name="student_understood" rows={5} defaultValue={note.student_understood} className="field-input" />
            </div>
            <div>
              <label className="field-label">What the student struggled with</label>
              <textarea name="student_struggled_with" rows={5} defaultValue={note.student_struggled_with} className="field-input" />
            </div>
            <div>
              <label className="field-label">Recommended homework</label>
              <textarea name="recommended_homework" rows={5} defaultValue={note.recommended_homework ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Admin status</label>
              <input name="admin_status" defaultValue={note.admin_status} className="field-input" />
            </div>
            <div>
              <label className="field-label">Admin feedback</label>
              <textarea name="admin_feedback" rows={4} defaultValue={note.admin_feedback ?? ""} className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save validation
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Linked records">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Student: {student ? `${student.first_name} ${student.last_name ?? ""}` : "No student linked"}</p>
              <p>Parent: {parent ? parent.full_name : "No parent linked"}</p>
              <p>Tutor: {tutor ? tutor.full_name : "No tutor linked"}</p>
              <p>Session: {session ? `${session.subject} · ${new Date(session.starts_at).toLocaleString()}` : "No session linked"}</p>
            </div>
          </SectionCard>

          <SectionCard title="Tutor-only notes">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Came prepared: {note.came_prepared ? "Yes" : "No"}</p>
              <p>Parent follow-up needed: {note.parent_follow_up_needed ? "Yes" : "No"}</p>
              <p>Internal concern: {note.internal_concern ? "Yes" : "No"}</p>
              <p>Continue same pace: {note.continue_same_pace ? "Yes" : "No"}</p>
              <p>{note.tutor_private_notes || "No tutor-private note was added."}</p>
            </div>
          </SectionCard>

          <SectionCard title="Send parent recap">
            <form action={sendAcademySessionRecapAction}>
              <input type="hidden" name="note_id" value={note.id} />
              <button type="submit" className="secondary-button">
                Send recap email
              </button>
            </form>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
