import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getStudentPortalSessionById,
  getStudentPortalSessions,
  getStudentPortalValidatedSessionNotes,
} from "@/lib/academy-portal-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

type StudentSessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentSessionDetailPage({ params }: StudentSessionDetailPageProps) {
  const { id } = await params;
  const { user, student } = await requireAcademyStudentUser();
  const [session, sessions, notes] = await Promise.all([
    getStudentPortalSessionById(student.id, id),
    getStudentPortalSessions(student.id),
    getStudentPortalValidatedSessionNotes(student.id),
  ]);

  if (!session) {
    notFound();
  }

  const note = notes.find((candidate) => candidate.session_id === session.id) ?? null;
  // The detail page should still point forward to the next lesson without introducing a broader planning workflow.
  const nextSession = sessions
    .filter((candidate) => candidate.id !== session.id && new Date(candidate.starts_at) > new Date(session.starts_at))
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())[0] ?? null;

  return (
    <PortalShell
      title={session.subject}
      subtitle="Review the session details that matter to the student workflow: meeting access, validated recap guidance, and the next learning step."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard
          title="Session overview"
          description="The student view stays focused on the scheduled lesson context and direct access to the live meeting."
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Starts: {new Date(session.starts_at).toLocaleString()}</p>
            <p>Ends: {new Date(session.ends_at).toLocaleString()}</p>
            <p>Course: {session.course_name || "Course name not specified"}</p>
            <p>Format: {session.format}</p>
            <p>Status: {session.status}</p>
            <p>
              Meeting link:{" "}
              {session.meeting_url ? (
                <a href={session.meeting_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  Open meeting
                </a>
              ) : (
                "Not available yet"
              )}
            </p>
            {nextSession ? (
              <p>
                Next scheduled session: {nextSession.subject} on {new Date(nextSession.starts_at).toLocaleString()}
              </p>
            ) : (
              <p>No later session is scheduled yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Validated recap"
          description="Only the finalized Academy-approved recap appears here so the student is not reading draft operational notes."
        >
          <div className="space-y-4 text-sm text-muted-foreground">
            {note ? (
              <>
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">What was covered</p>
                  <p className="mt-2">{note.what_was_covered}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">What the student understood</p>
                  <p className="mt-2">{note.student_understood}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">Topics that still need work</p>
                  <p className="mt-2">{note.student_struggled_with}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">Homework or follow-up</p>
                  <p className="mt-2">{note.recommended_homework || "No homework was assigned for this session."}</p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/50 p-4">
                <p className="font-medium text-foreground">No validated recap is available yet.</p>
                <p className="mt-2">
                  The tutor notes still need Academy review before they are shown in the student portal.
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
