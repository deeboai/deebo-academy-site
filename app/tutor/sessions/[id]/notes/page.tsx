import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getTutorPortalSessionById,
  getTutorPortalSessionNoteBySessionId,
} from "@/lib/academy-portal-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";
import { submitAcademyTutorSessionNotesAction } from "@/actions/academy-os-tutor";

type TutorSessionNotesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TutorSessionNotesPage({ params }: TutorSessionNotesPageProps) {
  const { id } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const session = await getTutorPortalSessionById(tutor.id, id);

  if (!session) {
    notFound();
  }

  const existingNote = await getTutorPortalSessionNoteBySessionId(tutor.id, session.id);

  return (
    <PortalShell
      title="Submit Session Notes"
      subtitle="Tutor notes are drafted, revised, and resubmitted here before the admin validates anything parent-facing."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/students", label: "Students" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <SectionCard title={`${session.subject} · ${new Date(session.starts_at).toLocaleString()}`}>
        {existingNote?.admin_status === "needs_revision" ? (
          <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-medium">This note needs revision.</p>
            <p className="mt-2">
              {existingNote.admin_feedback || "The admin marked this note for revision but did not leave extra detail."}
            </p>
          </div>
        ) : null}
        <form action={submitAcademyTutorSessionNotesAction} className="space-y-4">
          <input type="hidden" name="session_id" value={session.id} />
          <div>
            <label className="field-label">What was covered?</label>
            <textarea
              name="what_was_covered"
              rows={5}
              defaultValue={existingNote?.what_was_covered ?? ""}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">What did the student understand well?</label>
            <textarea
              name="student_understood"
              rows={5}
              defaultValue={existingNote?.student_understood ?? ""}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">What did the student struggle with?</label>
            <textarea
              name="student_struggled_with"
              rows={5}
              defaultValue={existingNote?.student_struggled_with ?? ""}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Recommended homework</label>
            <textarea
              name="recommended_homework"
              rows={4}
              defaultValue={existingNote?.recommended_homework ?? ""}
              className="field-input"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Did the student come prepared?</label>
              <select
                name="came_prepared"
                defaultValue={existingNote?.came_prepared ? "yes" : "no"}
                className="field-input"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="field-label">Continue at the same pace?</label>
              <select
                name="continue_same_pace"
                defaultValue={existingNote?.continue_same_pace === false ? "no" : "yes"}
                className="field-input"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="field-label">Is parent follow-up needed?</label>
              <select
                name="parent_follow_up_needed"
                defaultValue={existingNote?.parent_follow_up_needed ? "yes" : "no"}
                className="field-input"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="field-label">Any internal concern?</label>
              <select
                name="internal_concern"
                defaultValue={existingNote?.internal_concern ? "yes" : "no"}
                className="field-input"
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Private note for admin</label>
            <textarea
              name="tutor_private_notes"
              rows={4}
              defaultValue={existingNote?.tutor_private_notes ?? ""}
              className="field-input"
            />
          </div>
          <button type="submit" className="primary-button">
            {existingNote ? "Save notes" : "Submit notes"}
          </button>
        </form>
      </SectionCard>
    </PortalShell>
  );
}
