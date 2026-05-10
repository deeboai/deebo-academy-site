import Link from "next/link";
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
  manageAcademyRecordingAvailabilityAction,
  sendAcademySessionScheduledEmailAction,
  syncAcademySessionCalendarEventAction,
  updateAcademySessionAction,
} from "@/actions/academy-os-admin";
import { hasGoogleCalendarAutomationEnv } from "@/lib/env";
import {
  ACADEMY_PAYMENT_STATUSES,
  ACADEMY_SESSION_STATUSES,
} from "@/lib/academy-os";
import {
  buildAdminRecordingAccessPath,
  getRecordingAvailabilityState,
} from "@/lib/academy-recordings";

type SessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminSessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const calendarAutomationReady = hasGoogleCalendarAutomationEnv;
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
  const recordingAvailabilityState = getRecordingAvailabilityState(recording);

  return (
    <AdminShell
      title={session.subject}
      subtitle="Update the session record, synchronize the linked calendar event, attach the recording link, and review the downstream recap state."
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
              <label className="field-label">Status</label>
              <select name="status" defaultValue={session.status} className="field-input">
                {ACADEMY_SESSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Payment status</label>
              <select name="payment_status" defaultValue={session.payment_status} className="field-input">
                {ACADEMY_PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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

          <SectionCard title="Calendar automation">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Google Calendar event ID: {session.google_calendar_event_id || "No external event has been linked yet."}
              </p>
              <p>Meeting URL: {session.meeting_url || "No meeting URL is attached to this session yet."}</p>
              <p>
                {calendarAutomationReady
                  ? "Saving the session or running a manual sync will update the external calendar event from this Academy record."
                  : "Google Calendar automation is not configured yet. Add the Google Calendar env before relying on automatic event creation."}
              </p>
            </div>
            {calendarAutomationReady ? (
              <form action={syncAcademySessionCalendarEventAction} className="mt-4">
                <input type="hidden" name="session_id" value={session.id} />
                <button type="submit" className="secondary-button">
                  Sync Google Calendar event
                </button>
              </form>
            ) : null}
          </SectionCard>

          <SectionCard title="Email workflow">
            <p className="text-sm text-muted-foreground">
              Use this when the parent needs the session details resent without editing the session itself.
            </p>
            <form action={sendAcademySessionScheduledEmailAction} className="mt-4">
              <input type="hidden" name="session_id" value={session.id} />
              <button type="submit" className="secondary-button">
                Send scheduling email
              </button>
            </form>
          </SectionCard>

          <SectionCard
            title="Recording"
            description="Parent access now routes through an Academy-managed redirect, so the raw vendor URL is no longer exposed in the portal or recap emails."
          >
            <div className="mb-5 rounded-2xl border border-border/70 bg-background/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                Current state: {recordingAvailabilityState}
              </p>
              <p className="mt-2">
                {recording
                  ? `Expires at ${new Date(recording.expires_at).toLocaleString()}`
                  : "No recording is attached to this session yet."}
              </p>
              {recording ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={buildAdminRecordingAccessPath(session.id)} className="secondary-button px-4 py-2">
                    Open protected link
                  </Link>
                  <form action={manageAcademyRecordingAvailabilityAction}>
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="availability_action" value="expire-now" />
                    <button type="submit" className="secondary-button px-4 py-2">
                      Expire now
                    </button>
                  </form>
                  <form action={manageAcademyRecordingAvailabilityAction}>
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="availability_action" value="extend-7-days" />
                    <button type="submit" className="secondary-button px-4 py-2">
                      Extend 7 days
                    </button>
                  </form>
                  <form action={manageAcademyRecordingAvailabilityAction}>
                    <input type="hidden" name="session_id" value={session.id} />
                    <input type="hidden" name="availability_action" value="extend-30-days" />
                    <button type="submit" className="secondary-button px-4 py-2">
                      Extend 30 days
                    </button>
                  </form>
                  <form action={manageAcademyRecordingAvailabilityAction}>
                    <input type="hidden" name="session_id" value={session.id} />
                    <input
                      type="hidden"
                      name="availability_action"
                      value={recording.visible_to_parent ? "hide-from-parent" : "show-to-parent"}
                    />
                    <button type="submit" className="secondary-button px-4 py-2">
                      {recording.visible_to_parent ? "Hide from parent" : "Show to parent"}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
            <form action={attachAcademyRecordingAction} className="space-y-4">
              <input type="hidden" name="session_id" value={session.id} />
              <div>
                <label className="field-label">Recording URL</label>
                <input
                  name="recording_url"
                  defaultValue={recording?.recording_url ?? ""}
                  className="field-input"
                  placeholder="https://..."
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
