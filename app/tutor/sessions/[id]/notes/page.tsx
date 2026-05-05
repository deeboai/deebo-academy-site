import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionById } from "@/lib/academy-data";
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
  const session = await getAcademySessionById(id);

  if (!session || session.tutor_id !== tutor.id) {
    notFound();
  }

  return (
    <PortalShell
      title="Submit Session Notes"
      subtitle="Tutor notes are submitted here and only become parent-facing after admin validation."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <SectionCard title={`${session.subject} · ${new Date(session.starts_at).toLocaleString()}`}>
        <form action={submitAcademyTutorSessionNotesAction} className="space-y-4">
          <input type="hidden" name="session_id" value={session.id} />
          <div>
            <label className="field-label">What was covered?</label>
            <textarea name="what_was_covered" rows={5} className="field-input" />
          </div>
          <div>
            <label className="field-label">What did the student understand well?</label>
            <textarea name="student_understood" rows={5} className="field-input" />
          </div>
          <div>
            <label className="field-label">What did the student struggle with?</label>
            <textarea name="student_struggled_with" rows={5} className="field-input" />
          </div>
          <div>
            <label className="field-label">Recommended homework</label>
            <textarea name="recommended_homework" rows={4} className="field-input" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Did the student come prepared?</label>
              <select name="came_prepared" className="field-input">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="field-label">Continue at the same pace?</label>
              <select name="continue_same_pace" className="field-input">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="field-label">Is parent follow-up needed?</label>
              <select name="parent_follow_up_needed" className="field-input">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="field-label">Any internal concern?</label>
              <select name="internal_concern" className="field-input">
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Private note for admin</label>
            <textarea name="tutor_private_notes" rows={4} className="field-input" />
          </div>
          <button type="submit" className="primary-button">
            Submit notes
          </button>
        </form>
      </SectionCard>
    </PortalShell>
  );
}
