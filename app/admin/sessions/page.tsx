import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademyParents,
  listAcademySessions,
  listAcademyStudentSubjects,
  listAcademyStudents,
  listAcademyTutors,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { createAcademySessionAction } from "@/actions/academy-os-admin";
import { hasGoogleCalendarAutomationEnv } from "@/lib/env";
import {
  ACADEMY_PAYMENT_STATUSES,
  ACADEMY_SESSION_STATUSES,
} from "@/lib/academy-os";

export default async function AcademyAdminSessionsPage() {
  const user = await requireAcademyAdminUser();
  const calendarAutomationReady = hasGoogleCalendarAutomationEnv;
  const [sessions, parents, students, tutors, studentSubjects] = await Promise.all([
    listAcademySessions(),
    listAcademyParents(),
    listAcademyStudents(),
    listAcademyTutors(),
    listAcademyStudentSubjects(),
  ]);

  return (
    <AdminShell
      title="Sessions"
      subtitle="Sessions are the operational source of truth. When Google Calendar automation is configured, the app now creates or updates the external event and Meet link from this record."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <SectionCard
          title="Create session"
          description={
            calendarAutomationReady
              ? "Saving a session will also try to sync the Google Calendar event and meeting link."
              : "Google Calendar automation is not configured yet, so session creation will stay Academy-only until the missing env is added."
          }
        >
          <form action={createAcademySessionAction} className="space-y-4">
            <div>
              <label className="field-label">Parent</label>
              <select name="parent_id" className="field-input">
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Student</label>
              <select name="student_id" className="field-input">
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name ?? ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Tutor</label>
              <select name="tutor_id" className="field-input" defaultValue="">
                <option value="">Unassigned</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Student subject record</label>
              <select name="student_subject_id" className="field-input" defaultValue="">
                <option value="">No linked subject record</option>
                {studentSubjects.map((studentSubject) => (
                  <option key={studentSubject.id} value={studentSubject.id}>
                    {studentSubject.subject} · {studentSubject.course_name || "Course name pending"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Subject</label>
              <input name="subject" className="field-input" />
            </div>
            <div>
              <label className="field-label">Course name</label>
              <input name="course_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Starts at</label>
              <input name="starts_at" type="datetime-local" className="field-input" />
            </div>
            <div>
              <label className="field-label">Ends at</label>
              <input name="ends_at" type="datetime-local" className="field-input" />
            </div>
            <div>
              <label className="field-label">Format</label>
              <input name="format" defaultValue="online" className="field-input" />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input name="location" className="field-input" />
            </div>
            <div>
              <label className="field-label">Meeting URL</label>
              <input name="meeting_url" className="field-input" />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select name="status" defaultValue="scheduled" className="field-input">
                {ACADEMY_SESSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Payment status</label>
              <select name="payment_status" defaultValue="pending" className="field-input">
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

        <SectionCard title="Session list">
          {sessions.length ? (
            <div className="space-y-4">
              {sessions.map((session) => {
                const student = students.find((candidate) => candidate.id === session.student_id);
                const tutor = tutors.find((candidate) => candidate.id === session.tutor_id);

                return (
                  <article key={session.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {session.subject} · {session.course_name || "Course name pending"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {student ? `${student.first_name} ${student.last_name ?? ""}` : "No student linked"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.starts_at).toLocaleString()} · {session.status}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Tutor: {tutor?.full_name || "Unassigned"}
                        </p>
                      </div>
                      <Link href={`/admin/sessions/${session.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No sessions yet"
              description="Create the first session to start tracking scheduling, payments, notes, and recordings inside Academy OS."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
