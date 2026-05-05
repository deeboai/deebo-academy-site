import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyParentById,
  getAcademyRecordingBySessionId,
  getAcademySessionById,
  getAcademyStudentById,
  getAcademyTutorById,
  getAcademyValidatedSessionNoteBySessionId,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  attachAcademyRecordingAction,
  updateAcademySessionAction,
} from "@/actions/academy-os-admin";

type SessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminSessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const session = await getAcademySessionById(id);

  if (!session) {
    notFound();
  }

  const [parent, student, tutor, recording, note] = await Promise.all([
    session.parent_id ? getAcademyParentById(session.parent_id) : Promise.resolve(null),
    session.student_id ? getAcademyStudentById(session.student_id) : Promise.resolve(null),
    session.tutor_id ? getAcademyTutorById(session.tutor_id) : Promise.resolve(null),
    getAcademyRecordingBySessionId(session.id),
    getAcademyValidatedSessionNoteBySessionId(session.id),
  ]);

  return (
    <AdminShell
      title={session.subject}
      subtitle="Update the session record, attach the recording link, and review the downstream recap state."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <SectionCard title="Session record">
          <form action={updateAcademySessionAction} className="space-y-4">
            <input type="hidden" name="session_id" value={session.id} />
            <div>
              <label className="field-label">Subject</label>
              <input name="subject" defaultValue={session.subject} className="field-input" />
            </div>
            <div>
              <label className="field-label">Course name</label>
              <input name="course_name" defaultValue={session.course_name ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Starts at</label>
              <input
                name="starts_at"
                type="datetime-local"
                defaultValue={new Date(session.starts_at).toISOString().slice(0, 16)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Ends at</label>
              <input
                name="ends_at"
                type="datetime-local"
                defaultValue={new Date(session.ends_at).toISOString().slice(0, 16)}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Format</label>
              <input name="format" defaultValue={session.format} className="field-input" />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input name="location" defaultValue={session.location ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Meeting URL</label>
              <input name="meeting_url" defaultValue={session.meeting_url ?? ""} className="field-input" />
            </div>
            <div>
              <label className="field-label">Google Calendar event ID</label>
              <input
                name="google_calendar_event_id"
                defaultValue={session.google_calendar_event_id ?? ""}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Status</label>
              <input name="status" defaultValue={session.status} className="field-input" />
            </div>
            <div>
              <label className="field-label">Payment status</label>
              <input name="payment_status" defaultValue={session.payment_status} className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save session
            </button>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Linked records">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Parent: {parent ? parent.full_name : "No parent linked"}</p>
              <p>Student: {student ? `${student.first_name} ${student.last_name ?? ""}` : "No student linked"}</p>
              <p>Tutor: {tutor ? tutor.full_name : "No tutor linked"}</p>
            </div>
          </SectionCard>

          <SectionCard title="Recording">
            <form action={attachAcademyRecordingAction} className="space-y-4">
              <input type="hidden" name="session_id" value={session.id} />
              <div>
                <label className="field-label">Recording URL</label>
                <input
                  name="recording_url"
                  defaultValue={recording?.recording_url ?? ""}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Storage provider</label>
                <input
                  name="storage_provider"
                  defaultValue={recording?.storage_provider ?? "manual"}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Expires at</label>
                <input
                  name="expires_at"
                  type="datetime-local"
                  defaultValue={recording ? new Date(recording.expires_at).toISOString().slice(0, 16) : ""}
                  className="field-input"
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="visible_to_parent"
                  defaultChecked={recording?.visible_to_parent ?? true}
                />
                Visible to parent
              </label>
              <button type="submit" className="secondary-button">
                Save recording
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Validated note">
            <p className="text-sm text-muted-foreground">
              {note ? note.what_was_covered : "No validated or emailed session note is attached yet."}
            </p>
          </SectionCard>
        </div>
      </div>
    </AdminShell>
  );
}
