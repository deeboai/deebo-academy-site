import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getTutorPortalSessionNoteBySessionId,
  getTutorPortalSessionById,
  getTutorPortalStudentSubjects,
  getTutorPortalStudentById,
} from "@/lib/academy-portal-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

type TutorSessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TutorSessionDetailPage({ params }: TutorSessionDetailPageProps) {
  const { id } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const session = await getTutorPortalSessionById(tutor.id, id);

  if (!session) {
    notFound();
  }

  const [student, note, subjects] = await Promise.all([
    session.student_id ? getTutorPortalStudentById(tutor.id, session.student_id) : Promise.resolve(null),
    getTutorPortalSessionNoteBySessionId(tutor.id, session.id),
    session.student_id ? getTutorPortalStudentSubjects(tutor.id, session.student_id) : Promise.resolve([]),
  ]);

  return (
    <PortalShell
      title={session.subject}
      subtitle="Review student context, current note status, and any admin revision request before or after the tutoring meeting."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/students", label: "Students" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Session context">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Student: {student ? `${student.first_name} ${student.last_name ?? ""}` : "No student linked"}</p>
            <p>Course: {session.course_name || "Course name pending"}</p>
            <p>Starts: {new Date(session.starts_at).toLocaleString()}</p>
            <p>Ends: {new Date(session.ends_at).toLocaleString()}</p>
            <p>
              Meeting URL: {session.meeting_url ? (
                <a href={session.meeting_url} className="text-primary hover:underline">
                  Open meeting
                </a>
              ) : "Not attached yet"}
            </p>
            {student ? (
              <Link href={`/tutor/students/${student.id}`} className="secondary-button inline-flex px-4 py-2">
                Open student
              </Link>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Current note status">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Status: {note?.admin_status || "Not started"}</p>
            <p>
              Admin feedback: {note?.admin_feedback || "No admin feedback has been attached yet."}
            </p>
            <p>
              Current summary: {note?.what_was_covered || "No note has been submitted yet."}
            </p>
            <Link href={`/tutor/sessions/${session.id}/notes`} className="secondary-button inline-flex px-4 py-2">
              {note?.admin_status === "needs_revision" ? "Revise notes" : "Open notes"}
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Assigned subjects">
          <div className="space-y-3 text-sm text-muted-foreground">
            {subjects.length ? (
              subjects.map((subject) => (
                <div key={subject.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">{subject.subject}</p>
                  <p className="mt-1">{subject.course_name || "Course name pending"}</p>
                  <p className="mt-1">Level: {subject.level || "Not specified"}</p>
                </div>
              ))
            ) : (
              <p>No subject records are linked yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Tutor workflow">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Use the session notes flow after the meeting to submit the instructional summary.</p>
            <p>If the admin requests changes, the revision feedback stays attached to the current note.</p>
            <p>Parent-facing recap delivery still happens only after admin validation.</p>
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
